// Modulo server-only: motore di sincronizzazione del catalogo. NON va importato
// da codice client (usa db/node-postgres). I server function in server.ts ne
// usano le funzioni dentro gli handler (rimossi dal bundle client).
import { eq, sql } from 'drizzle-orm'
import { db } from '#/db/index'
import { catalogCards, catalogSets, catalogSync } from '#/db/schema'
import {
  fetchOnePieceSetCards,
  fetchOnePieceSets,
} from '#/services/catalog-sources'
import { CATALOG_GAMES } from '#/features/catalog/games'
import type { CatalogGame } from '#/features/catalog/games'
import type { CatalogSet } from '#/db/schema'
import type { SourceCard, SourceSet } from '#/services/catalog-sources'

const SET_SOURCES: Record<CatalogGame, () => Promise<Array<SourceSet>>> = {
  onepiece: fetchOnePieceSets,
}

const CARD_SOURCES: Record<
  CatalogGame,
  (externalId: string) => Promise<Array<SourceCard>>
> = {
  onepiece: fetchOnePieceSetCards,
}

/**
 * Dati freschi entro 7 giorni: oltre, al primo accesso si ri-sincronizza
 * dall'API aggiungendo solo le novità (onConflictDoNothing: gli esistenti,
 * inclusi i logo_url modificati a mano, non vengono toccati).
 */
const SYNC_TTL_MS = 7 * 24 * 60 * 60 * 1000

function isFresh(syncedAt: Date | null): boolean {
  return syncedAt !== null && Date.now() - syncedAt.getTime() < SYNC_TTL_MS
}

/** Sincronizza la lista espansioni di un gioco se mai fatta o scaduta (TTL). */
export async function ensureSetsSynced(game: CatalogGame): Promise<void> {
  const meta = (
    await db
      .select()
      .from(catalogSync)
      .where(eq(catalogSync.game, game))
      .limit(1)
  ).at(0)
  if (isFresh(meta?.setsSyncedAt ?? null)) return

  let sets: Array<SourceSet>
  try {
    sets = await SET_SOURCES[game]()
  } catch {
    // API irraggiungibile: si tiene la copia in DB e si riproverà al prossimo accesso.
    return
  }
  if (sets.length === 0) return

  await db
    .insert(catalogSets)
    .values(
      sets.map((set, position) => ({
        id: `${game}:${set.externalId}`,
        game,
        externalId: set.externalId,
        name: set.name,
        logoUrl: set.logoUrl,
        symbolUrl: set.symbolUrl,
        cardCount: set.cardCount,
        position,
      })),
    )
    .onConflictDoNothing()

  await db
    .insert(catalogSync)
    .values({ game, setsSyncedAt: new Date() })
    .onConflictDoUpdate({
      target: catalogSync.game,
      set: { setsSyncedAt: new Date() },
    })
}

/** Sincronizza le carte di un set se mai fatto o scaduto (TTL). */
export async function ensureSetCardsSynced(set: CatalogSet): Promise<void> {
  if (isFresh(set.cardsSyncedAt)) return

  const game = set.game
  let sourceCards: Array<SourceCard>
  try {
    sourceCards = await CARD_SOURCES[game](set.externalId)
  } catch {
    // API irraggiungibile: si tiene la copia in DB e si riproverà al prossimo accesso.
    return
  }

  // Dedup difensivo sull'id di STAMPA (card_image_id): base e alt-art hanno id
  // diversi e restano righe distinte; si scartano solo veri duplicati. Teniamo
  // solo le carte con immagine: senza non sono mostrabili né visualizzabili in
  // 3D, ed evitano i placeholder "immagine non disponibile".
  const seen = new Map<string, SourceCard>()
  for (const card of sourceCards) {
    if (card.imageUrl && !seen.has(card.externalId)) {
      seen.set(card.externalId, card)
    }
  }
  const usable = Array.from(seen.values())

  if (usable.length > 0) {
    await db
      .insert(catalogCards)
      .values(
        usable.map((card) => ({
          id: `${game}:${card.externalId}`,
          setId: set.id,
          game,
          name: card.name,
          number: card.number,
          rarity: card.rarity,
          imageUrl: card.imageUrl,
          cardType: card.cardType,
          color: card.color,
          // Il listato set espone già il market_price per ogni stampa: lo
          // salviamo subito (USD) così ogni carta ha un valore senza attendere
          // il refresh pigro; il TTL 24h lo terrà poi aggiornato.
          price: card.price,
          priceCurrency: card.price !== null ? 'USD' : null,
          priceUpdatedAt: card.price !== null ? new Date() : null,
          // Data di aggiornamento prezzo dichiarata da OPTCG (solo data).
          priceScrapedAt: card.scrapedAt,
        })),
      )
      // Upsert: aggiorna i campi mutabili così le immagini/nomi/prezzi aggiunti
      // su OPTCG dopo la prima sync compaiono al refresh (TTL), niente null fissi.
      .onConflictDoUpdate({
        target: catalogCards.id,
        set: {
          name: sql`excluded.name`,
          number: sql`excluded.number`,
          rarity: sql`excluded.rarity`,
          imageUrl: sql`excluded.image_url`,
          cardType: sql`excluded.card_type`,
          color: sql`excluded.color`,
          price: sql`excluded.price`,
          priceCurrency: sql`excluded.price_currency`,
          priceUpdatedAt: sql`excluded.price_updated_at`,
          priceScrapedAt: sql`excluded.price_scraped_at`,
        },
      })
  }

  await db
    .update(catalogSets)
    .set({
      cardsSyncedAt: new Date(),
      // Conteggio onesto: solo le carte realmente disponibili (con immagine).
      cardCount: usable.length,
    })
    .where(eq(catalogSets.id, set.id))
}

/**
 * Sincronizza l'intero catalogo (tutte le espansioni e le loro carte) per ogni
 * gioco. Rispetta i TTL, quindi è economico da ri-eseguire. Utile per popolare
 * la ricerca globale e come base per un eventuale aggiornamento schedulato.
 */
export async function syncAllCatalog(): Promise<void> {
  for (const game of CATALOG_GAMES) {
    await ensureSetsSynced(game)
    const sets = await db
      .select()
      .from(catalogSets)
      .where(eq(catalogSets.game, game))
    let cursor = 0
    const worker = async () => {
      while (cursor < sets.length) {
        await ensureSetCardsSynced(sets[cursor++])
      }
    }
    await Promise.all(Array.from({ length: 5 }, worker))
  }
}
