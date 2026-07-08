import { eq } from 'drizzle-orm'
import { db } from '#/db/index'
import { catalogCards } from '#/db/schema'
import { fetchOnePieceCardPrice } from '#/services/catalog-sources'
import type { CatalogGame } from '#/features/catalog/server'
import type { SourcePrice } from '#/services/catalog-sources'

/** I prezzi di mercato si aggiornano ~una volta al giorno: TTL 24h. */
export const PRICE_TTL_MS = 24 * 60 * 60 * 1000

const PRICE_SOURCES: Record<
  CatalogGame,
  (externalId: string) => Promise<SourcePrice | null>
> = {
  onepiece: fetchOnePieceCardPrice,
}

/** Forma minima mutabile di una carta catalogo per il refresh dei prezzi. */
export interface PricedCard {
  id: string
  game: string
  price: number | null
  priceCurrency: string | null
  priceUpdatedAt: Date | null
}

function isPriceFresh(updatedAt: Date | null): boolean {
  return updatedAt !== null && Date.now() - updatedAt.getTime() < PRICE_TTL_MS
}

/**
 * Aggiorna il prezzo di una carta catalogo se scaduto (TTL 24h), sia in DB sia
 * sull'oggetto passato (così il chiamante lo usa senza ri-query). L'id catalogo
 * è `${game}:${externalId}`. In caso di guasto fonte tiene il prezzo esistente.
 */
export async function refreshCatalogCardPrice(card: PricedCard): Promise<void> {
  if (isPriceFresh(card.priceUpdatedAt)) return
  if (card.game !== 'onepiece') return
  const source = PRICE_SOURCES[card.game]

  const externalId = card.id.slice(card.game.length + 1)
  const now = new Date()
  try {
    const result = await source(externalId)
    if (result) {
      card.price = result.price
      card.priceCurrency = result.currency
    }
    // Anche senza prezzo, segna il tentativo per non riprovare prima del TTL.
    card.priceUpdatedAt = now
    await db
      .update(catalogCards)
      .set({
        price: card.price,
        priceCurrency: card.priceCurrency,
        priceUpdatedAt: now,
      })
      .where(eq(catalogCards.id, card.id))
  } catch {
    // Fonte irraggiungibile: si tiene il prezzo già in DB.
  }
}

/** Aggiorna i prezzi di più carte con concorrenza limitata (gentile con le API). */
export async function refreshCatalogCardPrices(
  cards: Array<PricedCard>,
  concurrency = 6,
): Promise<void> {
  const queue = cards.filter((c) => !isPriceFresh(c.priceUpdatedAt))
  let cursor = 0
  async function worker(): Promise<void> {
    while (cursor < queue.length) {
      await refreshCatalogCardPrice(queue[cursor++])
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, queue.length) }, worker),
  )
}
