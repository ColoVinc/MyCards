/**
 * Sorgenti esterne del catalogo carte.
 * - Pokémon: TCGdex (https://tcgdex.dev) — dati in italiano, senza API key.
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

const TCGDEX_BASE = 'https://api.tcgdex.net/v2/it'
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

/* ---------- Pokémon (TCGdex) ---------- */

interface TcgdexSetBrief {
  id: string
  name: string
  logo?: string
  symbol?: string
  cardCount: { total: number; official: number }
}

interface TcgdexCardBrief {
  id: string
  localId: string
  name: string
  image?: string
}

export async function fetchPokemonSets(): Promise<Array<SourceSet>> {
  // Escludiamo la serie "tcgp" (Pokémon TCG Pocket): è il gioco digitale,
  // non carte fisiche da collezione, e su TCGdex spesso manca di carte/immagini.
  const [sets, pocket] = await Promise.all([
    fetchJson<Array<TcgdexSetBrief>>(`${TCGDEX_BASE}/sets`),
    fetchJson<{ sets: Array<{ id: string }> }>(
      `${TCGDEX_BASE}/series/tcgp`,
    ).catch(() => ({ sets: [] as Array<{ id: string }> })),
  ])
  const pocketIds = new Set(pocket.sets.map((s) => s.id))

  return sets
    .filter((set) => !pocketIds.has(set.id))
    .map((set) => ({
      externalId: set.id,
      name: set.name,
      logoUrl: set.logo ? `${set.logo}.png` : null,
      symbolUrl: set.symbol ? `${set.symbol}.png` : null,
      cardCount: set.cardCount.official || set.cardCount.total,
    }))
}

export async function fetchPokemonSetCards(
  externalId: string,
): Promise<Array<SourceCard>> {
  const set = await fetchJson<{ cards: Array<TcgdexCardBrief> }>(
    `${TCGDEX_BASE}/sets/${encodeURIComponent(externalId)}`,
  )
  return set.cards.map((card) => ({
    externalId: card.id,
    name: card.name,
    number: card.localId,
    rarity: null, // il listato TCGdex non espone la rarità
    imageUrl: card.image ? `${card.image}/high.webp` : null,
    cardType: null,
    color: null,
  }))
}

interface TcgdexCardDetail {
  pricing?: {
    cardmarket?: {
      unit?: string
      trend?: number
      avg?: number
      avg7?: number
    }
  }
}

/** Prezzo Cardmarket (EUR) della singola carta Pokémon da TCGdex. */
export async function fetchPokemonCardPrice(
  externalId: string,
): Promise<SourcePrice | null> {
  const card = await fetchJson<TcgdexCardDetail>(
    `${TCGDEX_BASE}/cards/${encodeURIComponent(externalId)}`,
  )
  const cm = card.pricing?.cardmarket
  const value = cm?.trend ?? cm?.avg ?? cm?.avg7
  if (typeof value !== 'number' || value <= 0) return null
  return { price: value, currency: 'EUR' }
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
