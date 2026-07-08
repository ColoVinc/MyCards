import {
  boolean,
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

/* ---------- Better Auth ---------- */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
})

/* ---------- MyCards ---------- */

export const COLLECTIONS = ['onepiece'] as const
export type CollectionId = (typeof COLLECTIONS)[number]

export const cards = pgTable(
  'cards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    // Carta del catalogo di provenienza: chiave per deduplicare le copie.
    catalogCardId: text('catalog_card_id'),
    name: text('name').notNull(),
    collection: text('collection', { enum: COLLECTIONS }).notNull(),
    series: text('series'),
    cardNumber: text('card_number'),
    rarity: text('rarity').notNull(),
    notes: text('notes'),
    frontImageUrl: text('front_image_url').notNull(),
    // Null per le carte aggiunte dal catalogo: il retro reale non è
    // disponibile e il viewer 3D usa un retro generato.
    backImageUrl: text('back_image_url'),
    // Numero di copie possedute: invece di righe duplicate, un contatore.
    quantity: integer('quantity').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('cards_user_id_idx').on(table.userId),
    index('cards_user_collection_idx').on(table.userId, table.collection),
    // Una sola riga per carta-catalogo per utente: l'upsert incrementa quantity.
    uniqueIndex('cards_user_catalog_card_idx').on(
      table.userId,
      table.catalogCardId,
    ),
  ],
)

export type Card = typeof cards.$inferSelect
export type NewCard = typeof cards.$inferInsert

/* ---------- Catalogo ufficiale (espansioni e carte da API esterne) ---------- */

export const catalogSets = pgTable(
  'catalog_sets',
  {
    /** `${game}:${externalId}` — es. "onepiece:OP-01". */
    id: text('id').primaryKey(),
    game: text('game', { enum: COLLECTIONS }).notNull(),
    externalId: text('external_id').notNull(),
    name: text('name').notNull(),
    logoUrl: text('logo_url'),
    symbolUrl: text('symbol_url'),
    cardCount: integer('card_count').notNull().default(0),
    /** Ordine di uscita (indice nella lista dell'API sorgente). */
    position: integer('position').notNull().default(0),
    /** Quando le carte del set sono state importate (sync pigra). */
    cardsSyncedAt: timestamp('cards_synced_at'),
  },
  (table) => [index('catalog_sets_game_idx').on(table.game)],
)

export const catalogCards = pgTable(
  'catalog_cards',
  {
    /** `${game}:${externalCardId}` — es. "onepiece:OP01-016". */
    id: text('id').primaryKey(),
    setId: text('set_id')
      .notNull()
      .references(() => catalogSets.id, { onDelete: 'cascade' }),
    game: text('game', { enum: COLLECTIONS }).notNull(),
    name: text('name').notNull(),
    number: text('number'),
    rarity: text('rarity'),
    imageUrl: text('image_url'),
    cardType: text('card_type'),
    color: text('color'),
    // Valore di mercato nella valuta nativa della fonte (USD per One Piece via
    // OPTCG). Convertito a EUR a runtime.
    price: real('price'),
    priceCurrency: text('price_currency'),
    priceUpdatedAt: timestamp('price_updated_at'),
  },
  (table) => [
    index('catalog_cards_set_idx').on(table.setId),
    index('catalog_cards_game_name_idx').on(table.game, table.name),
  ],
)

/** Quando la lista espansioni di ogni gioco è stata sincronizzata l'ultima volta. */
export const catalogSync = pgTable('catalog_sync', {
  game: text('game').primaryKey(),
  setsSyncedAt: timestamp('sets_synced_at').notNull().defaultNow(),
})

/** Tassi di cambio (es. id "USD_EUR"), aggiornati una volta al giorno. */
export const fxRates = pgTable('fx_rates', {
  id: text('id').primaryKey(),
  rate: real('rate').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type CatalogSet = typeof catalogSets.$inferSelect
export type CatalogCard = typeof catalogCards.$inferSelect
