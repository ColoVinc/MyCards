// Assegna i loghi delle espansioni One Piece (in public/loghi-collezioni/) a
// catalog_sets.logo_url. Idempotente: si può rilanciare quando si aggiunge un
// nuovo file o si ricrea il DB. Non viene mai sovrascritto dalla sync
// automatica del catalogo (che tocca solo i set nuovi).
//
// Uso: node scripts/set-logos.mjs
//
// EB-01 "Extra Booster: Memorial Collection" non ha ancora un logo: aggiungi
// il file in public/loghi-collezioni/ e valorizza la entry qui sotto.
import { config } from 'dotenv'
import pg from 'pg'

config({ path: ['.env.local', '.env'] })

const LOGO_BY_EXTERNAL_ID = {
  'OP-01': 'romance-dawn.jpg',
  'OP-02': 'paramount-war.jpg',
  'OP-03': 'pillars-of-strength.png',
  'OP-04': 'kingdoms-of-intrigue.jpg',
  'OP-05': 'awakening-of-the-new-era.png',
  'OP-06': 'wings-of-the-captain.png',
  'OP-07': '500-years-in-the-future.jpg',
  'EB-01': null, // mancante: nessun file fornito
  'OP-08': 'two-legends.jpg',
  'OP-09': 'emperors-in-the-new-world.png',
  'OP-10': 'royal-blood.png',
  'OP-11': 'a-fist-of-divine-speed.png',
  'EB-02': 'extra-booster-anime-25-collection.webp',
  'OP-12': 'legacy-of-the-master.png',
  'PRB-01': 'premium-booster-the-best.jpg',
  'PRB-02': 'premium-booster-the-best-vol-2.webp',
  'OP-13': 'carrying-on-his-will.png',
  'OP14-EB04': 'the-azure-seas-seven.png',
  'EB-03': 'op-heroines-edition.jpg',
  'OP15-EB04': 'adventure-on-kamis-island.webp',
  'OP-16': 'the-time-of-battle.webp',
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

let updated = 0
const missing = []
for (const [externalId, filename] of Object.entries(LOGO_BY_EXTERNAL_ID)) {
  if (!filename) {
    missing.push(externalId)
    continue
  }
  const logoUrl = `/loghi-collezioni/${filename}`
  const res = await client.query(
    `UPDATE catalog_sets SET logo_url = $1 WHERE game = 'onepiece' AND external_id = $2`,
    [logoUrl, externalId],
  )
  if (res.rowCount > 0) updated++
  else console.log(`Nessun set trovato per external_id=${externalId}`)
}

console.log(`Loghi aggiornati: ${updated}`)
console.log(`Senza logo (nessun file fornito): ${missing.join(', ') || 'nessuno'}`)

await client.end()
