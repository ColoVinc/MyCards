-- Schema MyCards: tabelle Better Auth + collezione carte.
-- Eseguito automaticamente sul database di sviluppo provisionato da Neon Launchpad.
-- Tenere allineato a src/db/schema.ts (fonte di verità: drizzle/).

CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    image TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "session" (
    id TEXT PRIMARY KEY,
    expires_at TIMESTAMP NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at TIMESTAMP,
    refresh_token_expires_at TIMESTAMP,
    scope TEXT,
    password TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    catalog_card_id TEXT,
    name TEXT NOT NULL,
    collection TEXT NOT NULL,
    series TEXT,
    card_number TEXT,
    rarity TEXT NOT NULL,
    notes TEXT,
    front_image_url TEXT NOT NULL,
    back_image_url TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS cards_user_id_idx ON cards (user_id);
CREATE INDEX IF NOT EXISTS cards_user_collection_idx ON cards (user_id, collection);
CREATE UNIQUE INDEX IF NOT EXISTS cards_user_catalog_card_idx ON cards (user_id, catalog_card_id);

CREATE TABLE IF NOT EXISTS catalog_sets (
    id TEXT PRIMARY KEY,
    game TEXT NOT NULL,
    external_id TEXT NOT NULL,
    name TEXT NOT NULL,
    logo_url TEXT,
    symbol_url TEXT,
    card_count INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    cards_synced_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS catalog_sets_game_idx ON catalog_sets (game);

CREATE TABLE IF NOT EXISTS catalog_cards (
    id TEXT PRIMARY KEY,
    set_id TEXT NOT NULL REFERENCES catalog_sets(id) ON DELETE CASCADE,
    game TEXT NOT NULL,
    name TEXT NOT NULL,
    number TEXT,
    rarity TEXT,
    image_url TEXT,
    card_type TEXT,
    color TEXT,
    price REAL,
    price_currency TEXT,
    price_updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS catalog_cards_set_idx ON catalog_cards (set_id);
CREATE INDEX IF NOT EXISTS catalog_cards_game_name_idx ON catalog_cards (game, name);

CREATE TABLE IF NOT EXISTS catalog_sync (
    game TEXT PRIMARY KEY,
    sets_synced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fx_rates (
    id TEXT PRIMARY KEY,
    rate REAL NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
