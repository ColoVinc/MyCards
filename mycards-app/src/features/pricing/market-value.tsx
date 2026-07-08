import { formatEur } from '#/lib/format'
import type { CollectionId } from '#/db/schema'

interface PriceSource {
  label: string
  url: string
}

/** Fonte del prezzo + link verificabile, in base al gioco. */
function priceSourceFor(
  game: CollectionId,
  cardName: string,
): PriceSource | null {
  switch (game) {
    case 'pokemon':
      return {
        label: 'Cardmarket',
        url: `https://www.cardmarket.com/it/Pokemon/Products/Search?searchString=${encodeURIComponent(
          cardName,
        )}`,
      }
    case 'onepiece':
      return { label: 'OPTCG', url: 'https://optcgapi.com' }
    default:
      return null
  }
}

/**
 * Valore di mercato di una carta. Mostra la fonte corretta per gioco
 * (Cardmarket per Pokémon, OPTCG per One Piece) con link per verificare.
 */
export function MarketValue({
  priceEur,
  game,
  cardName,
  quantity = 1,
}: {
  priceEur: number | null
  game: CollectionId
  cardName: string
  quantity?: number
}) {
  const source = priceSourceFor(game, cardName)

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
        {source ? (
          <>
            Prezzo da{' '}
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-primary hover:underline"
            >
              {source.label}
            </a>{' '}
            · aggiornato giornalmente
          </>
        ) : (
          'Aggiornato giornalmente'
        )}
      </p>
    </div>
  )
}
