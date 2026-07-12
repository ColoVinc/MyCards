import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, ilike, or } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '#/db/index'
import { cards, catalogCards, catalogSets } from '#/db/schema'
import { requireUserId } from '#/features/auth/session.server'
import { getUsdToEur, toEur } from '#/services/fx'
import {
  refreshCatalogCardPrice,
  refreshCatalogCardPrices,
} from '#/services/pricing'
import { CATALOG_GAMES } from '#/features/catalog/games'
import {
  ensureSetCardsSynced,
  ensureSetsSynced,
} from '#/features/catalog/sync.server'
import type { CatalogCard, CatalogSet } from '#/db/schema'
import type { CatalogGame } from '#/features/catalog/games'

export { CATALOG_GAMES } from '#/features/catalog/games'
export type { CatalogGame } from '#/features/catalog/games'

const gameSchema = z.enum(CATALOG_GAMES)

export interface CatalogSearchResult {
  id: string
  game: CatalogGame
  externalId: string
  name: string
  number: string | null
  setName: string
  imageUrl: string | null
}

/** Ricerca globale nel catalogo per nome o codice carta (entrambi i giochi). */
export const searchCatalogFn = createServerFn({ method: 'GET' })
  .validator((query: string) =>
    typeof query === 'string' ? query.trim().slice(0, 80) : '',
  )
  .handler(async ({ data: query }): Promise<Array<CatalogSearchResult>> => {
    await requireUserId()
    if (query.length < 2) return []

    const term = `%${query.replaceAll('%', '\\%').replaceAll('_', '\\_')}%`
    const rows = await db
      .select({
        id: catalogCards.id,
        game: catalogCards.game,
        name: catalogCards.name,
        number: catalogCards.number,
        imageUrl: catalogCards.imageUrl,
        setName: catalogSets.name,
      })
      .from(catalogCards)
      .innerJoin(catalogSets, eq(catalogCards.setId, catalogSets.id))
      .where(
        or(ilike(catalogCards.name, term), ilike(catalogCards.number, term)),
      )
      .orderBy(asc(catalogCards.name))
      .limit(15)

    return rows.map((row) => ({
      id: row.id,
      game: row.game,
      externalId: row.id.slice(row.game.length + 1),
      name: row.name,
      number: row.number,
      setName: row.setName,
      imageUrl: row.imageUrl,
    }))
  })

export const listCatalogSetsFn = createServerFn({ method: 'GET' })
  .validator((game: CatalogGame) => gameSchema.parse(game))
  .handler(async ({ data: game }): Promise<Array<CatalogSet>> => {
    await requireUserId()
    await ensureSetsSynced(game)
    return db
      .select()
      .from(catalogSets)
      .where(eq(catalogSets.game, game))
      .orderBy(desc(catalogSets.position))
  })

export interface CatalogSetDetail {
  set: CatalogSet
  cards: Array<CatalogCard>
}

export const getCatalogSetFn = createServerFn({ method: 'GET' })
  .validator((setId: string) => {
    if (typeof setId !== 'string' || !setId) throw new Error('Id non valido')
    return setId
  })
  .handler(async ({ data: setId }): Promise<CatalogSetDetail | null> => {
    await requireUserId()
    const rows = await db
      .select()
      .from(catalogSets)
      .where(eq(catalogSets.id, setId))
      .limit(1)
    const set = rows.at(0)
    if (!set) return null

    await ensureSetCardsSynced(set)

    const setCards = await db
      .select()
      .from(catalogCards)
      .where(eq(catalogCards.setId, set.id))
      .orderBy(asc(catalogCards.number), asc(catalogCards.name))

    return { set, cards: setCards }
  })

export interface CatalogCardDetail extends CatalogCard {
  setName: string
  setExternalId: string
  /** Valore di mercato convertito in EUR (null se non disponibile). */
  priceEur: number | null
}

export const getCatalogCardFn = createServerFn({ method: 'GET' })
  .validator((catalogCardId: string) => {
    if (typeof catalogCardId !== 'string' || !catalogCardId) {
      throw new Error('Id non valido')
    }
    return catalogCardId
  })
  .handler(
    async ({ data: catalogCardId }): Promise<CatalogCardDetail | null> => {
      await requireUserId()
      const rows = await db
        .select({
          card: catalogCards,
          setName: catalogSets.name,
          setExternalId: catalogSets.externalId,
        })
        .from(catalogCards)
        .innerJoin(catalogSets, eq(catalogCards.setId, catalogSets.id))
        .where(eq(catalogCards.id, catalogCardId))
        .limit(1)
      const found = rows.at(0)
      if (!found) return null

      await refreshCatalogCardPrice(found.card)
      const usd = await getUsdToEur()

      return {
        ...found.card,
        setName: found.setName,
        setExternalId: found.setExternalId,
        priceEur: toEur(found.card.price, found.card.priceCurrency, usd),
      }
    },
  )

/**
 * Modifica di ±1 il numero di copie possedute di una carta del catalogo.
 * Niente righe duplicate: una sola riga per (utente, carta) con un contatore.
 * Restituisce la nuova quantità (0 se la carta è stata rimossa).
 */
export const adjustCatalogCardFn = createServerFn({ method: 'POST' })
  .validator((input: { catalogCardId: string; delta: number }) => {
    if (typeof input.catalogCardId !== 'string' || !input.catalogCardId) {
      throw new Error('Id non valido')
    }
    if (input.delta !== 1 && input.delta !== -1) {
      throw new Error('Variazione non valida')
    }
    return input
  })
  .handler(async ({ data }): Promise<{ quantity: number }> => {
    const userId = await requireUserId()

    const existingRows = await db
      .select({ id: cards.id, quantity: cards.quantity })
      .from(cards)
      .where(
        and(
          eq(cards.userId, userId),
          eq(cards.catalogCardId, data.catalogCardId),
        ),
      )
      .limit(1)
    const existing = existingRows.at(0)

    if (!existing) {
      if (data.delta < 0) return { quantity: 0 }

      const found = (
        await db
          .select({ card: catalogCards, setName: catalogSets.name })
          .from(catalogCards)
          .innerJoin(catalogSets, eq(catalogCards.setId, catalogSets.id))
          .where(eq(catalogCards.id, data.catalogCardId))
          .limit(1)
      ).at(0)
      if (!found) throw new Error('Carta non trovata nel catalogo')
      if (!found.card.imageUrl) {
        throw new Error('Immagine non disponibile per questa carta')
      }

      await db.insert(cards).values({
        userId,
        catalogCardId: data.catalogCardId,
        name: found.card.name,
        collection: found.card.game,
        series: found.setName,
        cardNumber: found.card.number,
        rarity: found.card.rarity ?? 'N/D',
        notes: null,
        frontImageUrl: found.card.imageUrl,
        backImageUrl: null,
        quantity: 1,
      })
      // Recupera subito il prezzo così la nuova carta ha già un valore.
      await refreshCatalogCardPrice(found.card)
      return { quantity: 1 }
    }

    const newQuantity = existing.quantity + data.delta
    if (newQuantity <= 0) {
      await db.delete(cards).where(eq(cards.id, existing.id))
      return { quantity: 0 }
    }

    await db
      .update(cards)
      .set({ quantity: newQuantity })
      .where(eq(cards.id, existing.id))
    return { quantity: newQuantity }
  })

/** Copie possedute di ogni carta del set, mappate per id-catalogo (per i badge). */
export const getOwnedQuantitiesFn = createServerFn({ method: 'GET' })
  .validator((setId: string) => {
    if (typeof setId !== 'string' || !setId) throw new Error('Id non valido')
    return setId
  })
  .handler(async ({ data: setId }): Promise<Record<string, number>> => {
    const userId = await requireUserId()
    const rows = await db
      .select({
        catalogCardId: cards.catalogCardId,
        quantity: cards.quantity,
      })
      .from(cards)
      .innerJoin(catalogCards, eq(cards.catalogCardId, catalogCards.id))
      .where(and(eq(cards.userId, userId), eq(catalogCards.setId, setId)))

    const quantities: Record<string, number> = {}
    for (const row of rows) {
      if (row.catalogCardId) quantities[row.catalogCardId] = row.quantity
    }
    return quantities
  })

/** Copie possedute di una singola carta del catalogo. */
export const getOwnedQuantityFn = createServerFn({ method: 'GET' })
  .validator((catalogCardId: string) => {
    if (typeof catalogCardId !== 'string' || !catalogCardId) {
      throw new Error('Id non valido')
    }
    return catalogCardId
  })
  .handler(async ({ data: catalogCardId }): Promise<number> => {
    const userId = await requireUserId()
    const rows = await db
      .select({ quantity: cards.quantity })
      .from(cards)
      .where(
        and(eq(cards.userId, userId), eq(cards.catalogCardId, catalogCardId)),
      )
      .limit(1)
    return rows.at(0)?.quantity ?? 0
  })

export interface CollectionValue {
  /** Valore totale della collezione in EUR (somma prezzo × quantità). */
  totalEur: number
  /** Carte distinte con un prezzo disponibile / senza prezzo. */
  pricedCards: number
  unpricedCards: number
}

/** Valore totale della collezione personale, aggiornando i prezzi scaduti. */
export const getCollectionValueFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CollectionValue> => {
    const userId = await requireUserId()

    const owned = await db
      .select({
        quantity: cards.quantity,
        id: catalogCards.id,
        game: catalogCards.game,
        number: catalogCards.number,
        price: catalogCards.price,
        priceCurrency: catalogCards.priceCurrency,
        priceUpdatedAt: catalogCards.priceUpdatedAt,
      })
      .from(cards)
      .innerJoin(catalogCards, eq(cards.catalogCardId, catalogCards.id))
      .where(eq(cards.userId, userId))

    // Aggiorna i prezzi scaduti (TTL 24h) delle carte possedute.
    await refreshCatalogCardPrices(owned)

    const usd = await getUsdToEur()
    let totalEur = 0
    let pricedCards = 0
    let unpricedCards = 0
    for (const row of owned) {
      const eur = toEur(row.price, row.priceCurrency, usd)
      if (eur === null) {
        unpricedCards++
      } else {
        pricedCards++
        totalEur += eur * row.quantity
      }
    }

    return {
      totalEur: Math.round(totalEur * 100) / 100,
      pricedCards,
      unpricedCards,
    }
  },
)
