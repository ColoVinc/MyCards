import { Suspense, lazy, useEffect, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { ArrowLeft, Move3d, Trash2 } from 'lucide-react'
import { AppHeader } from '#/components/app-header'
import { RarityChip } from '#/components/rarity-chip'
import { Button } from '#/components/ui/button'
import { cardQueryOptions } from '#/features/cards/queries'
import { deleteCardFn } from '#/features/cards/server'
import { QuantityStepper } from '#/features/catalog/quantity-stepper'
import { COLLECTION_LABELS, isFoilRarity } from '#/features/cards/validation'
import { MarketValue } from '#/features/pricing/market-value'
import type { Card } from '#/db/schema'
import type { CardWithPrice } from '#/features/cards/server'

const Card3DViewer = lazy(() => import('#/features/cards/card-3d'))

export const Route = createFileRoute('/_authed/cards/$cardId')({
  loader: ({ context, params }) => {
    context.queryClient.prefetchQuery(cardQueryOptions(params.cardId))
  },
  component: CardDetailPage,
})

function CardDetailPage() {
  const { user } = Route.useRouteContext()
  const { cardId } = Route.useParams()

  return (
    <div className="min-h-screen">
      <AppHeader user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link
          to="/dashboard"
          className="group inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform group-hover:-translate-x-1"
            aria-hidden="true"
          />
          Torna alla collezione
        </Link>

        <Suspense fallback={<DetailSkeleton />}>
          <CardDetail cardId={cardId} />
        </Suspense>
      </main>
    </div>
  )
}

function CardDetail({ cardId }: { cardId: string }) {
  const { data: card } = useSuspenseQuery(cardQueryOptions(cardId))

  if (!card) {
    return (
      <div className="mt-16 text-center">
        <h1 className="font-display text-2xl font-bold">Carta non trovata</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          La carta che cerchi non esiste o non appartiene alla tua collezione.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(340px,480px)_1fr]">
      <Viewer card={card} />
      <InfoPanel card={card} />
    </div>
  )
}

function Viewer({ card }: { card: Card }) {
  // R3F va montato solo sul client: evita il rendering del canvas in SSR.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div>
      <div className="relative aspect-[2.5/3.5] w-full overflow-hidden rounded-lg border border-border/60 bg-gradient-to-b from-surface-dim to-card shadow-2xl shadow-primary/10">
        <RarityChip
          rarity={card.rarity}
          className="absolute top-3 right-3 z-10"
        />
        {mounted ? (
          <Suspense fallback={<ViewerFallback front={card.frontImageUrl} />}>
            <Card3DViewer
              frontUrl={card.frontImageUrl}
              backUrl={card.backImageUrl}
              foil={isFoilRarity(card.rarity)}
            />
          </Suspense>
        ) : (
          <ViewerFallback front={card.frontImageUrl} />
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

function InfoPanel({ card }: { card: CardWithPrice }) {
  const dateFormatter = new Intl.DateTimeFormat('it-IT', { dateStyle: 'long' })

  return (
    <div>
      {card.series && <p className="label-caps text-primary">{card.series}</p>}
      <h1 className="mt-2 border-l-4 border-primary pl-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        {card.name}
      </h1>

      <MarketValue
        priceEur={card.priceEur}
        quantity={card.quantity}
        updatedAt={card.priceScrapedAt}
      />

      <dl className="mt-8 grid grid-cols-2 gap-4">
        <InfoBox
          label="Collezione"
          value={COLLECTION_LABELS[card.collection]}
        />
        <InfoBox
          label="Data inserimento"
          value={dateFormatter.format(new Date(card.createdAt))}
        />
        <InfoBox label="Numero carta" value={card.cardNumber || '—'} />
        <InfoBox label="Rarità" value={card.rarity} />
      </dl>

      {card.catalogCardId && (
        <div className="mt-8">
          <p className="label-caps mb-3 text-muted-foreground">
            Copie nella collezione
          </p>
          <CollectionQuantity
            catalogCardId={card.catalogCardId}
            quantity={card.quantity}
          />
        </div>
      )}

      {card.notes && (
        <section className="mt-8">
          <h2 className="label-caps border-b border-border/60 pb-3 text-muted-foreground">
            Note personali
          </h2>
          <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {card.notes}
          </p>
        </section>
      )}

      <DeleteCard cardId={card.id} cardName={card.name} />
    </div>
  )
}

function CollectionQuantity({
  catalogCardId,
  quantity,
}: {
  catalogCardId: string
  quantity: number
}) {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(quantity)

  return (
    <QuantityStepper
      catalogCardId={catalogCardId}
      quantity={current}
      onChange={(value) => {
        setCurrent(value)
        // Ultima copia rimossa: la carta non è più in collezione.
        if (value === 0) navigate({ to: '/dashboard' })
      }}
    />
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

function DeleteCard({
  cardId,
  cardName,
}: {
  cardId: string
  cardName: string
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: () => deleteCardFn({ data: cardId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cards'] })
      navigate({ to: '/dashboard' })
    },
  })

  return (
    <div className="mt-10 border-t border-border/60 pt-6">
      {confirming ? (
        <div className="rounded-md bg-destructive/5 p-4">
          <p className="text-sm font-medium">
            Eliminare definitivamente «{cardName}» dalla collezione?
          </p>
          <div className="mt-4 flex gap-3">
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? 'Eliminazione…' : 'Sì, elimina'}
            </Button>
            <Button
              variant="subtle"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => setConfirming(false)}
            >
              Annulla
            </Button>
          </div>
          {deleteMutation.isError && (
            <p className="mt-3 text-xs font-medium text-destructive">
              Eliminazione non riuscita, riprova.
            </p>
          )}
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-destructive hover:underline"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Elimina dalla collezione
        </button>
      )}
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
