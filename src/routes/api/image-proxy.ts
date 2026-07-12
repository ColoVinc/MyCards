import { createFileRoute } from '@tanstack/react-router'

/**
 * Proxy per le immagini del catalogo usate come texture WebGL: le sorgenti
 * esterne non garantiscono header CORS, quindi le serviamo dalla nostra
 * origine. Solo host noti, per non diventare un open proxy.
 */
const ALLOWED_HOSTS = ['optcgapi.com', 'www.optcgapi.com']

function isAllowed(hostname: string): boolean {
  return (
    ALLOWED_HOSTS.includes(hostname) ||
    hostname.endsWith('.blob.vercel-storage.com')
  )
}

export const Route = createFileRoute('/api/image-proxy')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const target = new URL(request.url).searchParams.get('url')
        if (!target) return new Response('Missing url', { status: 400 })

        let parsed: URL
        try {
          parsed = new URL(target)
        } catch {
          return new Response('Invalid url', { status: 400 })
        }
        if (parsed.protocol !== 'https:' || !isAllowed(parsed.hostname)) {
          return new Response('Host not allowed', { status: 403 })
        }

        const upstream = await fetch(parsed, {
          signal: AbortSignal.timeout(20_000),
        })
        if (!upstream.ok) {
          return new Response('Upstream error', { status: 502 })
        }

        // Bufferizziamo l'intera immagine: lo streaming di un ReadableStream
        // non viene servito in modo affidabile dall'adapter Nitro e produce
        // immagini troncate che <img> non riesce a decodificare.
        const buffer = await upstream.arrayBuffer()
        return new Response(buffer, {
          headers: {
            'content-type':
              upstream.headers.get('content-type') ?? 'image/jpeg',
            'content-length': String(buffer.byteLength),
            'cache-control': 'public, max-age=86400, immutable',
            'access-control-allow-origin': '*',
          },
        })
      },
    },
  },
})
