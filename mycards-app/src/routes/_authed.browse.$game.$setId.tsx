import { Suspense, useMemo, useState } from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ArrowLeft, ImageOff, Search } from 'lucide-react'
import { AppHeader } from '#/components/app-header'
import { RarityChip } from '#/components/rarity-chip'
import { PAGE_SIZE, Pagination } from '#/components/ui/pagination'
import {
  catalogSetQueryOptions,
  ownedQuantitiesQueryOptions,
} from '#/features/catalog/queries'
import { CATALOG_GAMES } from '#/features/catalog/server'
import type { CatalogCard } from '#/db/schema'
import type { CatalogGame } from '#/features/catalog/server'

export const Route = createFileRoute('/_authed/browse/$game/$setId')({
  params: {
    parse: (params) => {
      if (!CATALOG_GAMES.includes(params.game as CatalogGame)) {
        throw notFound()
      }
      return { game: params.game as CatalogGame, setId: params.setId }
    },
  },
  loader: ({ context, params }) => {
    context.queryClient.prefetchQuery(
      catalogSetQueryOptions(`${params.game}:${params.setId}`),
    )
  },
  component: CatalogSetPage,
})

function CatalogSetPage() {
  const { user } = Route.useRouteContext()
  const { game, setId } = Route.useParams()

  return (
    <div className="min-h-screen">
      <AppHeader user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link
          to="/browse/$game"
          params={{ game }}
          className="group inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform group-hover:-translate-x-1"
            aria-hidden="true"
          />
          Tutte le espansioni
        </Link>

        <Suspense fallback={<SetSkeleton />}>
          <SetDetail fullSetId={`${game}:${setId}`} />
        </Suspense>
      </main>
    </div>
  )
}

function SetDetail({ fullSetId }: { fullSetId: string }) {
  const { data } = useSuspenseQuery(catalogSetQueryOptions(fullSetId))
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filteredCards = useMemo(() => {
    if (!data) return []
    const term = search.trim().toLowerCase()
    if (!term) return data.cards
    return data.cards.filter(
      (card) =>
        card.name.toLowerCase().includes(term) ||
        (card.number ?? '').toLowerCase().includes(term),
    )
  }, [data, search])

  if (!data) {
    return (
      <div className="mt-16 text-center">
        <h1 className="font-display text-2xl font-bold">
          Espansione non trovata
        </h1>
      </div>
    )
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {(data.set.logoUrl || data.set.symbolUrl) && (
            <img
              src={data.set.logoUrl ?? data.set.symbolUrl ?? ''}
              alt=""
              className="h-12 max-w-32 object-contain"
            />
          )}
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">
              {data.set.name}
            </h1>
            <p className="label-caps mt-1 text-muted-foreground">
              {data.cards.length} carte — {data.set.externalId}
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Cerca per nome o numero…"
            aria-label="Cerca nell'espansione"
            className="h-10 w-full rounded-full border border-border/60 bg-card pr-4 pl-9 text-sm shadow-sm placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          />
        </div>
      </div>

      {filteredCards.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted-foreground">
          Nessuna carta corrisponde alla ricerca.
        </p>
      ) : (
        <PaginatedCards
          cards={filteredCards}
          setId={data.set.id}
          page={page}
          onPageChange={setPage}
        />
      )}
    </>
  )
}

function PaginatedCards({
  cards,
  setId,
  page,
  onPageChange,
}: {
  cards: Array<CatalogCard>
  setId: string
  page: number
  onPageChange: (page: number) => void
}) {
  const pageCount = Math.ceil(cards.length / PAGE_SIZE)
  const currentPage = Math.min(page, pageCount)
  const visibleCards = cards.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  return (
    <>
      <CatalogCardsGrid cards={visibleCards} setId={setId} />
      <Pagination
        page={currentPage}
        pageCount={pageCount}
        onPageChange={onPageChange}
      />
    </>
  )
}

function CatalogCardsGrid({
  cards,
  setId,
}: {
  cards: Array<CatalogCard>
  setId: string
}) {
  const { data: quantities } = useSuspenseQuery(
    ownedQuantitiesQueryOptions(setId),
  )

  return (
    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 xl:grid-cols-5">
      {cards.map((card) => (
        <CatalogCardTile
          key={card.id}
          card={card}
          owned={quantities[card.id] ?? 0}
        />
      ))}
    </div>
  )
}

function CatalogCardTile({
  card,
  owned,
}: {
  card: CatalogCard
  owned: number
}) {
  // L'id catalogo è `${game}:${externalId}`; per la route serve solo l'externalId.
  const externalId = card.id.slice(card.game.length + 1)

  return (
    <Link
      to="/catalog/$game/$cardId"
      params={{ game: card.game, cardId: externalId }}
      className="group block focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-label={`Apri ${card.name}`}
    >
      <article className="card-lift card-gloss overflow-hidden rounded-lg border border-border/60 bg-card">
        <div className="relative aspect-2.5/3.5 bg-surface-dim">
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={`Carta ${card.name}`}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageOff className="h-8 w-8" aria-hidden="true" />
              <span className="text-xs">Immagine non disponibile</span>
            </span>
          )}
          {card.rarity && (
            <RarityChip
              rarity={card.rarity}
              className="absolute top-2 right-2"
            />
          )}
          {owned > 0 && (
            <span className="label-caps absolute top-2 left-2 rounded-xl bg-ink/80 px-2 py-1.5 text-white">
              ×{owned}
            </span>
          )}
        </div>
        <div className="space-y-1 p-3">
          <h3
            className="truncate font-display text-sm font-bold group-hover:text-primary"
            title={card.name}
          >
            {card.name}
          </h3>
          <span className="font-label text-xs font-medium text-outline-soft">
            {card.number ? `#${card.number}` : '—'}
          </span>
        </div>
      </article>
    </Link>
  )
}

function SetSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-lg border border-border/60 bg-card"
        >
          <div className="aspect-2.5/3.5 animate-pulse bg-surface-dim" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-surface-dim" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-surface-dim" />
          </div>
        </div>
      ))}
    </div>
  )
}
