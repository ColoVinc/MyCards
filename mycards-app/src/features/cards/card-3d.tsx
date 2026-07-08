import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import * as THREE from 'three'

const CARD_WIDTH = 2.5
const CARD_HEIGHT = 3.5
const CARD_DEPTH = 0.025

/**
 * Le immagini del catalogo (OPTCG) sono cross-origin e senza header
 * CORS: caricate direttamente come texture WebGL falliscono. Le scarichiamo
 * dal nostro proxy same-origin come blob e ne creiamo un object URL, che il
 * caricatore di texture consuma senza problemi di CORS. Gli upload locali
 * (/uploads) restano diretti.
 */
const blobUrlCache = new Map<string, string>()
const blobPromiseCache = new Map<string, Promise<string>>()

function resolveTextureUrl(url: string): Promise<string> {
  let promise = blobPromiseCache.get(url)
  if (!promise) {
    promise = fetch(`/api/image-proxy?url=${encodeURIComponent(url)}`)
      .then((response) => {
        if (!response.ok) throw new Error(`proxy ${response.status}`)
        return response.blob()
      })
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob)
        blobUrlCache.set(url, objectUrl)
        return objectUrl
      })
    blobPromiseCache.set(url, promise)
  }
  return promise
}

/** Risolve l'URL della texture sospendendo (throw promise) finché il blob non è pronto. */
function getTextureUrl(url: string): string {
  if (!url.startsWith('http')) return url
  const cached = blobUrlCache.get(url)
  if (cached) return cached
  throw resolveTextureUrl(url)
}

/**
 * Shader olografico per carte foil: bande iridescenti che scorrono
 * in funzione dell'angolo di vista (fresnel) e del tempo.
 */
const holoVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPosition.xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const holoFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float facing = dot(normalize(vViewDir), normalize(vNormal));
    // Solo la faccia rivolta alla camera brilla; il retro resta pulito.
    float front = smoothstep(0.0, 0.25, facing);
    float fresnel = pow(1.0 - abs(facing), 1.6);

    float bands = sin((vUv.x * 7.0 + vUv.y * 9.0) + uTime * 1.2 + fresnel * 6.0);
    vec3 rainbow = 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + bands * 0.35 + fresnel * 0.8));

    float sparkleSeed = fract(sin(dot(floor(vUv * 90.0), vec2(12.9898, 78.233))) * 43758.5453);
    float sparkle = step(0.985, sparkleSeed) * (0.5 + 0.5 * sin(uTime * 3.0 + sparkleSeed * 40.0));

    float strength = front * uIntensity * (fresnel * 0.6 + 0.05) + sparkle * front * 0.35;
    gl_FragColor = vec4(rainbow * strength, strength);
  }
`

/**
 * Retro generato per le carte aggiunte dal catalogo (di cui non abbiamo la
 * foto del retro reale): un dorso brandizzato MyCards disegnato su canvas.
 */
let generatedBackTexture: THREE.CanvasTexture | null = null

function getGeneratedBackTexture(): THREE.CanvasTexture {
  if (generatedBackTexture) return generatedBackTexture

  const canvas = document.createElement('canvas')
  canvas.width = 500
  canvas.height = 700
  const ctx = canvas.getContext('2d')!

  const gradient = ctx.createLinearGradient(0, 0, 500, 700)
  gradient.addColorStop(0, '#0041c8')
  gradient.addColorStop(1, '#001551')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 500, 700)

  // Trama a rombi leggera
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
  ctx.lineWidth = 2
  for (let i = -700; i < 1200; i += 46) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + 700, 700)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(i + 700, 0)
    ctx.lineTo(i, 700)
    ctx.stroke()
  }

  // Cornice
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.lineWidth = 10
  ctx.strokeRect(22, 22, 456, 656)

  // Marchio centrale
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
  ctx.font = 'bold 64px Sora, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('MyCards', 250, 350)
  ctx.font = '700 20px "Space Grotesk", monospace'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.fillText('C O L L E C T O R', 250, 405)

  generatedBackTexture = new THREE.CanvasTexture(canvas)
  generatedBackTexture.colorSpace = THREE.SRGBColorSpace
  return generatedBackTexture
}

function CardMesh({
  frontUrl,
  backUrl,
  foil,
}: {
  frontUrl: string
  backUrl: string | null
  foil: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const holoMaterialRef = useRef<THREE.ShaderMaterial>(null)

  const front = getTextureUrl(frontUrl)
  const back = backUrl ? getTextureUrl(backUrl) : null
  const textures = useTexture(back ? [front, back] : [front])
  const frontTexture = textures[0]
  const loadedBackTexture = textures.length > 1 ? textures[1] : null

  const materials = useMemo(() => {
    const backTexture = loadedBackTexture ?? getGeneratedBackTexture()
    frontTexture.colorSpace = THREE.SRGBColorSpace
    backTexture.colorSpace = THREE.SRGBColorSpace
    frontTexture.anisotropy = 8
    backTexture.anisotropy = 8
    // Specchia il retro così il testo resta leggibile guardando la carta da dietro.
    backTexture.wrapS = THREE.RepeatWrapping
    backTexture.repeat.x = -1

    const edge = new THREE.MeshStandardMaterial({
      color: '#e8e8ee',
      roughness: 0.6,
    })
    const frontMat = new THREE.MeshPhysicalMaterial({
      map: frontTexture,
      roughness: 0.35,
      metalness: 0.05,
      clearcoat: 0.6,
      clearcoatRoughness: 0.35,
    })
    const backMat = new THREE.MeshPhysicalMaterial({
      map: backTexture,
      roughness: 0.35,
      metalness: 0.05,
      clearcoat: 0.6,
      clearcoatRoughness: 0.35,
    })
    // Ordine facce BoxGeometry: +x, -x, +y, -y, +z (fronte), -z (retro)
    return [edge, edge, edge, edge, frontMat, backMat]
  }, [frontTexture, loadedBackTexture])

  const holoUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0.9 },
    }),
    [],
  )

  useFrame((state, delta) => {
    if (holoMaterialRef.current) {
      holoMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
    // Lieve oscillazione "idle" quando l'utente non interagisce.
    if (groupRef.current) {
      groupRef.current.rotation.y +=
        Math.sin(state.clock.elapsedTime * 0.4) * delta * 0.02
    }
  })

  return (
    <group ref={groupRef}>
      <mesh material={materials} castShadow>
        <boxGeometry args={[CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH]} />
      </mesh>
      {foil && (
        <mesh position={[0, 0, CARD_DEPTH / 2 + 0.002]}>
          <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
          <shaderMaterial
            ref={holoMaterialRef}
            vertexShader={holoVertexShader}
            fragmentShader={holoFragmentShader}
            uniforms={holoUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  )
}

export default function Card3DViewer({
  frontUrl,
  backUrl,
  foil,
}: {
  frontUrl: string
  backUrl: string | null
  foil: boolean
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.2], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: 'none' }}
      aria-label="Visualizzatore 3D della carta: trascina per ruotare, rotella o pinch per lo zoom"
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} />
      <pointLight position={[-5, -2, 4]} intensity={0.5} color="#b6c4ff" />
      <Suspense fallback={null}>
        <CardMesh frontUrl={frontUrl} backUrl={backUrl} foil={foil} />
      </Suspense>
      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={8}
        rotateSpeed={0.9}
      />
    </Canvas>
  )
}
