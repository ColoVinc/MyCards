import { Suspense, lazy, useEffect, useState } from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ArrowLeft, Move3d } from 'lucide-react'
import { AppHeader } from '#/components/app-header'
import { RarityChip } from '#/components/rarity-chip'
import {
  catalogCardQueryOptions,
  ownedQuantityQueryOptions,
} from '#/features/catalog/queries'
import { QuantityStepper } from '#/features/catalog/quantity-stepper'
import { CATALOG_GAMES } from '#/features/catalog/server'
import { COLLECTION_LABELS, isFoilRarity } from '#/features/cards/validation'
import { MarketValue } from '#/features/pricing/market-value'
import type {
  CardPrint,
  CatalogCardDetail,
  CatalogGame,
} from '#/features/catalog/server'

const Card3DViewer = lazy(() => import('#/features/cards/card-3d'))

export const Route = createFileRoute('/_authed/catalog/$game/$cardId')({
  params: {
    parse: (params) => {
      if (!CATALOG_GAMES.includes(params.game as CatalogGame)) {
        throw notFound()
      }
      return { game: params.game as CatalogGame, cardId: params.cardId }
    },
  },
  loader: ({ context, params }) => {
    context.queryClient.prefetchQuery(
      catalogCardQueryOptions(`${params.game}:${params.cardId}`),
    )
  },
  component: CatalogCardPage,
})

function CatalogCardPage() {
  const { user } = Route.useRouteContext()
  const { game, cardId } = Route.useParams()

  return (
    <div className="min-h-screen">
      <AppHeader user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Suspense fallback={<DetailSkeleton />}>
          <CatalogCardDetailView game={game} fullCardId={`${game}:${cardId}`} />
        </Suspense>
      </main>
    </div>
  )
}

function CatalogCardDetailView({
  game,
  fullCardId,
}: {
  game: CatalogGame
  fullCardId: string
}) {
  const { data: card } = useSuspenseQuery(catalogCardQueryOptions(fullCardId))

  if (!card) {
    return (
      <div className="mt-16 text-center">
        <h1 className="font-display text-2xl font-bold">Carta non trovata</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Questa carta non è nel catalogo. Apri prima l'espansione di
          appartenenza.
        </p>
        <Link
          to="/browse/$game"
          params={{ game }}
          className="mt-6 inline-block font-bold text-primary hover:underline"
        >
          Vai alle espansioni
        </Link>
      </div>
    )
  }

  return (
    <>
      <Link
        to="/browse/$game/$setId"
        params={{ game, setId: card.setExternalId }}
        className="group inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
      >
        <ArrowLeft
          className="h-4 w-4 transition-transform group-hover:-translate-x-1"
          aria-hidden="true"
        />
        {card.setName}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(340px,480px)_1fr]">
        <Viewer card={card} />
        <InfoPanel card={card} game={game} />
      </div>
    </>
  )
}

function Viewer({ card }: { card: CatalogCardDetail }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div>
      <div className="relative aspect-[2.5/3.5] w-full overflow-hidden rounded-lg border border-border/60 bg-gradient-to-b from-surface-dim to-card shadow-2xl shadow-primary/10">
        {card.rarity && (
          <RarityChip
            rarity={card.rarity}
            className="absolute top-3 right-3 z-10"
          />
        )}
        {mounted && card.imageUrl ? (
          <Suspense fallback={<ViewerFallback front={card.imageUrl} />}>
            <Card3DViewer
              frontUrl={card.imageUrl}
              backUrl={null}
              foil={isFoilRarity(card.rarity ?? '')}
            />
          </Suspense>
        ) : (
          card.imageUrl && <ViewerFallback front={card.imageUrl} />
        )}
      </div>
      <p className="label-caps mt-3 flex items-center justify-center gap-2 text-muted-foreground">
        <Move3d className="h-4 w-4" aria-hidden="true" />
        Trascina per ruotare — rotella per lo zoom
      </p>
    </div>
  )
}

function ViewerFallback({ front }: { front: string }) {
  return (
    <img
      src={front}
      alt="Anteprima carta"
      className="absolute inset-0 h-full w-full object-contain p-8"
    />
  )
}

function InfoPanel({
  card,
  game,
}: {
  card: CatalogCardDetail
  game: CatalogGame
}) {
  return (
    <div>
      <p className="label-caps text-primary">{card.setName}</p>
      <h1 className="mt-2 border-l-4 border-primary pl-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        {card.name}
      </h1>

      <MarketValue priceEur={card.priceEur} updatedAt={card.priceScrapedAt} />

      <dl className="mt-8 grid grid-cols-2 gap-4">
        <InfoBox label="Collezione" value={COLLECTION_LABELS[game]} />
        <InfoBox label="Numero carta" value={card.number || '—'} />
        <InfoBox label="Rarità" value={card.rarity || 'N/D'} />
        {card.cardType && <InfoBox label="Tipo" value={card.cardType} />}
        {card.color && <InfoBox label="Colore" value={card.color} />}
      </dl>

      <PrintSelector
        game={game}
        prints={card.prints}
        activeExternalId={card.id.slice(game.length + 1)}
      />

      <CollectionControl catalogCardId={card.id} />
    </div>
  )
}

/**
 * Etichetta breve di ogni stampa: si toglie il prefisso comune a tutti i nomi
 * (es. "Nefeltari Vivi (001)") lasciando il distinguo — "(Alternate Art)" →
 * "Alternate Art"; la base, che non ha resto, diventa "Originale".
 */
function printLabels(prints: Array<CardPrint>): Array<string> {
  const names = prints.map((p) => p.name)
  let prefix = names[0] ?? ''
  for (const name of names) {
    while (!name.startsWith(prefix)) prefix = prefix.slice(0, -1)
  }
  return names.map((name) => {
    const rest = name
      .slice(prefix.length)
      .trim()
      .replace(/^\(|\)$/g, '')
      .trim()
    return rest || 'Originale'
  })
}

function PrintSelector({
  game,
  prints,
  activeExternalId,
}: {
  game: CatalogGame
  prints: Array<CardPrint>
  activeExternalId: string
}) {
  if (prints.length < 2) return null
  const labels = printLabels(prints)

  return (
    <div className="mt-8">
      <p className="label-caps mb-3 text-muted-foreground">
        Stampe — {prints.length} versioni
      </p>
      <div className="flex flex-wrap gap-3">
        {prints.map((print, i) => {
          const active = print.externalId === activeExternalId
          return (
            <Link
              key={print.externalId}
              to="/catalog/$game/$cardId"
              params={{ game, cardId: print.externalId }}
              aria-current={active ? 'true' : undefined}
              className={`group w-24 shrink-0 rounded-lg border p-1.5 text-center transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                active
                  ? 'border-primary ring-2 ring-primary/40'
                  : 'border-border/60 hover:border-primary/60'
              }`}
            >
              <div className="relative aspect-[2.5/3.5] overflow-hidden rounded bg-surface-dim">
                {print.imageUrl && (
                  <img
                    src={print.imageUrl}
                    alt={print.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </div>
              <span
                className={`mt-1.5 block truncate text-xs font-medium ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
                title={labels[i]}
              >
                {labels[i]}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted p-4">
      <dt className="label-caps text-muted-foreground">{label}</dt>
      <dd className="mt-2 font-display text-lg font-bold break-words">
        {value}
      </dd>
    </div>
  )
}

function CollectionControl({ catalogCardId }: { catalogCardId: string }) {
  const { data: initialQuantity } = useSuspenseQuery(
    ownedQuantityQueryOptions(catalogCardId),
  )
  const [quantity, setQuantity] = useState(initialQuantity)

  return (
    <div className="mt-10 border-t border-border/60 pt-6">
      <p className="label-caps mb-3 text-muted-foreground">
        Copie nella collezione
      </p>
      <QuantityStepper
        catalogCardId={catalogCardId}
        quantity={quantity}
        onChange={setQuantity}
      />
      <p className="mt-4 text-sm text-muted-foreground">
        {quantity === 0 ? (
          'Usa + per aggiungerla alla tua collezione.'
        ) : (
          <Link to="/dashboard" className="font-bold text-primary">
            Vai alla collezione
          </Link>
        )}
      </p>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(340px,480px)_1fr]">
      <div className="aspect-[2.5/3.5] animate-pulse rounded-lg bg-surface-dim" />
      <div className="space-y-4">
        <div className="h-4 w-32 animate-pulse rounded bg-surface-dim" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-surface-dim" />
        <div className="mt-8 grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-md bg-surface-dim"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
