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
  /** Identificativo unico della STAMPA (card_image_id, es. "EB03-001_p1"). */
  externalId: string
  /** Codice carta condiviso tra le stampe (card_set_id, es. "EB03-001"). */
  baseId: string
  name: string
  number: string | null
  rarity: string | null
  imageUrl: string | null
  cardType: string | null
  color: string | null
  /** Valore di mercato dal listato set (USD), se presente. */
  price: number | null
  /** Data (YYYY-MM-DD) in cui la fonte ha rilevato il prezzo, se presente. */
  scrapedAt: string | null
}

export interface SourcePrice {
  /** Valore di mercato nella valuta nativa della fonte. */
  price: number
  currency: 'EUR' | 'USD'
  /** Data (YYYY-MM-DD) in cui la fonte ha rilevato il prezzo, se presente. */
  scrapedAt: string | null
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
  /** Unico per stampa: la base coincide con card_set_id, le alt-art hanno un
   * suffisso (es. "EB03-001_p1"). */
  card_image_id: string
  card_name: string
  rarity: string
  card_type: string
  card_color: string
  card_image: string
  market_price?: number | string
  /** Data (YYYY-MM-DD) dell'ultimo scraping del prezzo da parte di OPTCG. */
  date_scraped?: string
}

function toPrice(value: number | string | undefined): number | null {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
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
    // La chiave della carta è la STAMPA (card_image_id): così base e alt-art
    // diventano righe distinte con immagine e prezzo propri. Il codice carta
    // (card_set_id) resta in `number`, uguale per tutte le stampe.
    externalId: card.card_image_id || card.card_set_id,
    baseId: card.card_set_id,
    name: card.card_name,
    number: card.card_set_id,
    rarity: OPTCG_RARITY_LABELS[card.rarity] ?? card.rarity,
    imageUrl: card.card_image || null,
    cardType: card.card_type || null,
    color: card.card_color || null,
    price: toPrice(card.market_price),
    scrapedAt: card.date_scraped || null,
  }))
}

/**
 * Prezzo di mercato (USD) di una singola STAMPA One Piece da OPTCG.
 * L'endpoint prende il codice carta base (card_set_id) e restituisce TUTTE le
 * stampe: si seleziona quella giusta tramite `printId` (card_image_id).
 */
export async function fetchOnePieceCardPrice(
  baseId: string,
  printId: string,
): Promise<SourcePrice | null> {
  const data = await fetchJson<Array<OptcgCard> | OptcgCard>(
    `${OPTCG_BASE}/sets/card/${encodeURIComponent(baseId)}/`,
  )
  const prints = Array.isArray(data) ? data : [data]
  const card = prints.find((c) => c.card_image_id === printId) ?? prints.at(0)
  const value = toPrice(card?.market_price)
  if (value === null) return null
  return {
    price: value,
    currency: 'USD',
    scrapedAt: card?.date_scraped || null,
  }
}
