/**
 * Sorgenti esterne del catalogo carte.
 * - One Piece: OPTCG API (https://optcgapi.com) — dati EN, senza API key.
 */

export interface SourceSet {
  externalId: string
  name: string
  logoUrl: string | null
  symbolUrl: string | null
  cardCount: number
}

export interface SourceCard {
  externalId: string
  name: string
  number: string | null
  rarity: string | null
  imageUrl: string | null
  cardType: string | null
  color: string | null
}

export interface SourcePrice {
  /** Valore di mercato nella valuta nativa della fonte. */
  price: number
  currency: 'EUR' | 'USD'
}

const OPTCG_BASE = 'https://optcgapi.com/api'

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) {
    throw new Error(
      `Sorgente catalogo non raggiungibile (${response.status}): ${url}`,
    )
  }
  return response.json() as Promise<T>
}

/* ---------- One Piece (OPTCG API) ---------- */

interface OptcgSet {
  set_name: string
  set_id: string
}

interface OptcgCard {
  card_set_id: string
  card_name: string
  rarity: string
  card_type: string
  card_color: string
  card_image: string
  market_price?: number | string
}

const OPTCG_RARITY_LABELS: Record<string, string> = {
  C: 'Common',
  UC: 'Uncommon',
  R: 'Rare',
  SR: 'Super Rare',
  L: 'Leader',
  SEC: 'Secret Rare',
  SP: 'Special',
  P: 'Promo',
  TR: 'Treasure Rare',
}

export async function fetchOnePieceSets(): Promise<Array<SourceSet>> {
  const sets = await fetchJson<Array<OptcgSet>>(`${OPTCG_BASE}/allSets/`)
  return sets.map((set) => ({
    externalId: set.set_id,
    name: set.set_name,
    logoUrl: null,
    symbolUrl: null,
    cardCount: 0, // l'API non lo espone nel listato: aggiornato dopo la sync carte
  }))
}

export async function fetchOnePieceSetCards(
  externalId: string,
): Promise<Array<SourceCard>> {
  const cards = await fetchJson<Array<OptcgCard>>(
    `${OPTCG_BASE}/sets/${encodeURIComponent(externalId)}/`,
  )
  return cards.map((card) => ({
    externalId: card.card_set_id,
    name: card.card_name,
    number: card.card_set_id,
    rarity: OPTCG_RARITY_LABELS[card.rarity] ?? card.rarity,
    imageUrl: card.card_image || null,
    cardType: card.card_type || null,
    color: card.card_color || null,
  }))
}

/** Prezzo di mercato (USD) della singola carta One Piece da OPTCG. */
export async function fetchOnePieceCardPrice(
  externalId: string,
): Promise<SourcePrice | null> {
  const data = await fetchJson<Array<OptcgCard> | OptcgCard>(
    `${OPTCG_BASE}/sets/card/${encodeURIComponent(externalId)}/`,
  )
  const card = Array.isArray(data) ? data.at(0) : data
  const value = Number(card?.market_price)
  if (!Number.isFinite(value) || value <= 0) return null
  return { price: value, currency: 'USD' }
}
