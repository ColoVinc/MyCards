import { formatDate, formatEur } from '#/lib/format'

/** Fonte del prezzo One Piece con link verificabile. */
const PRICE_SOURCE = { label: 'OPTCG', url: 'https://optcgapi.com' }

/** Valore di mercato di una carta, con la fonte e un link per verificare. */
export function MarketValue({
  priceEur,
  quantity = 1,
  updatedAt = null,
}: {
  priceEur: number | null
  quantity?: number
  /** Data (YYYY-MM-DD) in cui OPTCG ha rilevato il prezzo. */
  updatedAt?: string | null
}) {
  return (
    <div className="mt-6 rounded-md bg-primary/5 p-4">
      <p className="label-caps text-muted-foreground">Valore di mercato</p>

      {priceEur === null ? (
        <p className="mt-1 text-sm text-muted-foreground">Non disponibile</p>
      ) : (
        <p className="mt-1 font-display text-3xl font-extrabold text-primary">
          {formatEur(priceEur * quantity)}
          {quantity > 1 && (
            <span className="ml-2 font-sans text-sm font-medium text-muted-foreground">
              ({formatEur(priceEur)} × {quantity})
            </span>
          )}
        </p>
      )}

      <p className="mt-1 text-xs text-muted-foreground">
        Prezzo da{' '}
        <a
          href={PRICE_SOURCE.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-primary hover:underline"
        >
          {PRICE_SOURCE.label}
        </a>{' '}
        {updatedAt
          ? `· aggiornato il ${formatDate(updatedAt)}`
          : '· aggiornato giornalmente'}
      </p>
    </div>
  )
}
