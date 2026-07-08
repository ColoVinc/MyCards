import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, ilike, or } from 'drizzle-orm'
import { db } from '#/db/index'
import { cards, catalogCards } from '#/db/schema'
import { requireUserId } from '#/features/auth/session.server'
import { cardFiltersSchema } from '#/features/cards/validation'
import { deleteCardImage } from '#/services/storage'
import { getUsdToEur, toEur } from '#/services/fx'
import { refreshCatalogCardPrice } from '#/services/pricing'
import type { Card } from '#/db/schema'
import type { CardFilters } from '#/features/cards/validation'

/** Carta della collezione con il valore di mercato convertito in EUR. */
export interface CardWithPrice extends Card {
  priceEur: number | null
}

export interface CardListResult {
  cards: Array<CardWithPrice>
  /** Rarità presenti nella collezione dell'utente, per il filtro dinamico. */
  rarities: Array<string>
  total: number
}

export const listCardsFn = createServerFn({ method: 'GET' })
  .validator((filters: CardFilters) => cardFiltersSchema.parse(filters))
  .handler(async ({ data: filters }): Promise<CardListResult> => {
    const userId = await requireUserId()

    const conditions = [eq(cards.userId, userId)]

    if (filters.collection && filters.collection !== 'all') {
      conditions.push(eq(cards.collection, filters.collection))
    }
    if (filters.rarity) {
      conditions.push(eq(cards.rarity, filters.rarity))
    }
    if (filters.q) {
      const term = `%${filters.q.replaceAll('%', '\\%').replaceAll('_', '\\_')}%`
      conditions.push(
        or(ilike(cards.name, term), ilike(cards.cardNumber, term))!,
      )
    }

    const orderBy = {
      'date-desc': [desc(cards.createdAt)],
      'date-asc': [asc(cards.createdAt)],
      'name-asc': [asc(cards.name)],
      'name-desc': [desc(cards.name)],
      rarity: [asc(cards.rarity), desc(cards.createdAt)],
    }[filters.sort ?? 'date-desc']

    const [rows, rarityRows, totalRows, usd] = await Promise.all([
      db
        .select({
          card: cards,
          price: catalogCards.price,
          priceCurrency: catalogCards.priceCurrency,
        })
        .from(cards)
        .leftJoin(catalogCards, eq(cards.catalogCardId, catalogCards.id))
        .where(and(...conditions))
        .orderBy(...orderBy),
      db
        .selectDistinct({ rarity: cards.rarity })
        .from(cards)
        .where(eq(cards.userId, userId))
        .orderBy(asc(cards.rarity)),
      db.select({ id: cards.id }).from(cards).where(eq(cards.userId, userId)),
      getUsdToEur(),
    ])

    return {
      cards: rows.map((row) => ({
        ...row.card,
        priceEur: toEur(row.price, row.priceCurrency, usd),
      })),
      rarities: rarityRows.map((r) => r.rarity),
      total: totalRows.length,
    }
  })

export const getCardFn = createServerFn({ method: 'GET' })
  .validator((cardId: string) => {
    if (typeof cardId !== 'string' || !cardId) throw new Error('Id non valido')
    return cardId
  })
  .handler(async ({ data: cardId }): Promise<CardWithPrice | null> => {
    const userId = await requireUserId()
    const rows = await db
      .select({
        card: cards,
        catId: catalogCards.id,
        game: catalogCards.game,
        price: catalogCards.price,
        priceCurrency: catalogCards.priceCurrency,
        priceUpdatedAt: catalogCards.priceUpdatedAt,
      })
      .from(cards)
      .leftJoin(catalogCards, eq(cards.catalogCardId, catalogCards.id))
      .where(and(eq(cards.id, cardId), eq(cards.userId, userId)))
      .limit(1)
    const row = rows.at(0)
    if (!row) return null

    let priceEur: number | null = null
    if (row.catId && row.game) {
      const priced = {
        id: row.catId,
        game: row.game,
        price: row.price,
        priceCurrency: row.priceCurrency,
        priceUpdatedAt: row.priceUpdatedAt,
      }
      await refreshCatalogCardPrice(priced)
      const usd = await getUsdToEur()
      priceEur = toEur(priced.price, priced.priceCurrency, usd)
    }
    return { ...row.card, priceEur }
  })

export const deleteCardFn = createServerFn({ method: 'POST' })
  .validator((cardId: string) => {
    if (typeof cardId !== 'string' || !cardId) throw new Error('Id non valido')
    return cardId
  })
  .handler(async ({ data: cardId }): Promise<{ ok: true }> => {
    const userId = await requireUserId()
    const deletedRows = await db
      .delete(cards)
      .where(and(eq(cards.id, cardId), eq(cards.userId, userId)))
      .returning({
        frontImageUrl: cards.frontImageUrl,
        backImageUrl: cards.backImageUrl,
      })

    const deleted = deletedRows.at(0)
    if (deleted) {
      await Promise.all([
        deleteCardImage(deleted.frontImageUrl),
        deleteCardImage(deleted.backImageUrl),
      ])
    }

    return { ok: true }
  })
