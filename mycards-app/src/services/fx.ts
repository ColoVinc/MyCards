import { eq } from 'drizzle-orm'
import { db } from '#/db/index'
import { fxRates } from '#/db/schema'

const FX_TTL_MS = 24 * 60 * 60 * 1000
const USD_EUR_ID = 'USD_EUR'
/** Fallback prudente se la fonte cambi è irraggiungibile e non c'è cache. */
const USD_EUR_FALLBACK = 0.92

/**
 * Tasso USD→EUR aggiornato una volta al giorno (BCE via Frankfurter, no key).
 * In caso di guasto usa l'ultimo valore in DB, altrimenti un fallback.
 */
export async function getUsdToEur(): Promise<number> {
  const existing = (
    await db.select().from(fxRates).where(eq(fxRates.id, USD_EUR_ID)).limit(1)
  ).at(0)

  if (
    existing &&
    Date.now() - existing.updatedAt.getTime() < FX_TTL_MS &&
    existing.rate > 0
  ) {
    return existing.rate
  }

  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR', {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`fx ${res.status}`)
    const data = (await res.json()) as { rates?: { EUR?: number } }
    const rate = data.rates?.EUR
    if (typeof rate !== 'number' || rate <= 0) throw new Error('fx invalid')

    await db
      .insert(fxRates)
      .values({ id: USD_EUR_ID, rate, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: fxRates.id,
        set: { rate, updatedAt: new Date() },
      })
    return rate
  } catch {
    return existing?.rate ?? USD_EUR_FALLBACK
  }
}

/** Converte un prezzo nella sua valuta nativa in EUR. */
export function toEur(
  price: number | null,
  currency: string | null,
  usdToEur: number,
): number | null {
  if (price === null || price <= 0) return null
  if (currency === 'EUR') return price
  if (currency === 'USD') return price * usdToEur
  return null
}
