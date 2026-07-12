// Applica db/init.sql (idempotente) + allineamenti additivi al DB corrente.
// Utile dove drizzle-kit push non può chiedere conferme (shell non interattive).
import { readFileSync } from 'node:fs'
import { config } from 'dotenv'
import pg from 'pg'

config({ path: ['.env.local', '.env'] })

const sql = readFileSync(new URL('../db/init.sql', import.meta.url), 'utf8')
const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

// ALTER additivi sulla tabella esistente PRIMA di init.sql, così la
// creazione dell'indice unico (che referenzia catalog_card_id) non fallisce.
// Su un DB nuovo la tabella non esiste ancora: l'errore viene ignorato e
// init.sql crea tutto da zero.
const tryRun = async (query) => {
  try {
    await client.query(query)
  } catch {
    // la tabella potrebbe non esistere ancora (DB fresco): ignora
  }
}
await tryRun('ALTER TABLE cards ADD COLUMN IF NOT EXISTS catalog_card_id TEXT')
await tryRun(
  'ALTER TABLE cards ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1',
)
await tryRun('ALTER TABLE cards ALTER COLUMN back_image_url DROP NOT NULL')
await tryRun('ALTER TABLE catalog_cards ADD COLUMN IF NOT EXISTS price REAL')
await tryRun(
  'ALTER TABLE catalog_cards ADD COLUMN IF NOT EXISTS price_currency TEXT',
)
await tryRun(
  'ALTER TABLE catalog_cards ADD COLUMN IF NOT EXISTS price_updated_at TIMESTAMP',
)
await tryRun(
  'ALTER TABLE catalog_cards ADD COLUMN IF NOT EXISTS price_scraped_at DATE',
)

await client.query(sql)

// Pulizia delle righe legacy (carte senza riferimento al catalogo: vecchi
// inserimenti manuali e doppioni di test) ora che il modello è a quantità.
const deleted = await client.query(
  'DELETE FROM cards WHERE catalog_card_id IS NULL',
)
console.log(`Righe legacy rimosse da cards: ${deleted.rowCount}`)

const { rows } = await client.query(
  "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
)
console.log('Tabelle:', rows.map((r) => r.table_name).join(', '))
await client.end()
