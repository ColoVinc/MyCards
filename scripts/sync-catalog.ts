// Popola/aggiorna l'intero catalogo (tutte le espansioni + carte).
// Uso: npx tsx scripts/sync-catalog.ts
import { config } from 'dotenv'

config({ path: ['.env.local', '.env'] })

const { syncAllCatalog } = await import(
  '../src/features/catalog/sync.server.ts'
)
console.log('Sincronizzazione completa del catalogo in corso…')
await syncAllCatalog()

const { db } = await import('../src/db/index.ts')
const { sql } = await import('drizzle-orm')
const sets = await db.execute(sql`select count(*)::int n from catalog_sets`)
const cards = await db.execute(sql`select count(*)::int n from catalog_cards`)
console.log(`Fatto. Set: ${sets.rows[0].n}, carte: ${cards.rows[0].n}`)
process.exit(0)
