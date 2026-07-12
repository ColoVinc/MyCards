import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { Layers, Plus, Search } from 'lucide-react'
import { AppHeader } from '#/components/app-header'
import { Button } from '#/components/ui/button'
import { Select } from '#/components/ui/input'
import { PAGE_SIZE, Pagination } from '#/components/ui/pagination'
import { CardTile, CardTileSkeleton } from '#/features/cards/card-tile'
import { cardsQueryOptions } from '#/features/cards/queries'
import { collectionValueQueryOptions } from '#/features/catalog/queries'
import {
  SORT_LABELS,
  SORT_OPTIONS,
  cardFiltersSchema,
} from '#/features/cards/validation'
import { formatDate, formatEur } from '#/lib/format'
import type { CardFilters } from '#/features/cards/validation'

export const Route = createFileRoute('/_authed/dashboard')({
  validateSearch: cardFiltersSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    context.queryClient.prefetchQuery(cardsQueryOptions(deps))
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { user } = Route.useRouteContext()
  const filters = Route.useSearch()

  return (
    <div className="min-h-screen">
      <AppHeader user={user} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">
              La mia collezione
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tutte le tue carte, in un unico posto.
            </p>
          </div>
          <Link
            to="/browse/$game"
            params={{ game: 'onepiece' }}
            className="sm:hidden"
          >
            <Button size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Aggiungi carta
            </Button>
          </Link>
        </div>

        <Suspense fallback={<CollectionValueSkeleton />}>
          <CollectionValuePanel />
        </Suspense>

        <FiltersBar filters={filters} />

        <Suspense fallback={<GridSkeleton />}>
          {/* key sui filtri: rimonta la griglia e azzera la paginazione quando cambiano */}
          <CardsGrid key={JSON.stringify(filters)} filters={filters} />
        </Suspense>
      </main>
    </div>
  )
}

function FiltersBar({ filters }: { filters: CardFilters }) {
  const navigate = useNavigate({ from: Route.fullPath })
  // Stessa query della griglia, ma senza Suspense per non bloccare la barra.
  const { data } = useQuery(cardsQueryOptions(filters))

  function setFilter(patch: Partial<CardFilters>) {
    navigate({
      search: (prev) => ({ ...prev, ...patch }),
    })
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <div className="ml-auto flex flex-wrap items-center gap-3">
        <CollectionSearch
          initial={filters.q ?? ''}
          onChange={(q) => setFilter({ q })}
        />

        <Select
          aria-label="Filtra per rarità"
          value={filters.rarity ?? ''}
          onChange={(e) => setFilter({ rarity: e.target.value || undefined })}
          className="w-44"
        >
          <option value="">Tutte le rarità</option>
          {(data?.rarities ?? []).map((rarity) => (
            <option key={rarity} value={rarity}>
              {rarity}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Ordina per"
          value={filters.sort ?? 'date-desc'}
          onChange={(e) =>
            setFilter({
              sort:
                e.target.value === 'date-desc'
                  ? undefined
                  : (e.target.value as CardFilters['sort']),
            })
          }
          className="w-40"
        >
          {SORT_OPTIONS.map((sort) => (
            <option key={sort} value={sort}>
              {SORT_LABELS[sort]}
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}

function CollectionSearch({
  initial,
  onChange,
}: {
  initial: string
  onChange: (q: string | undefined) => void
}) {
  const [value, setValue] = useState(initial)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Debounce: aggiorna il filtro q senza navigare ad ogni tasto.
  useEffect(() => {
    const id = setTimeout(
      () => onChangeRef.current(value.trim() || undefined),
      300,
    )
    return () => clearTimeout(id)
  }, [value])

  return (
    <div className="relative w-full sm:w-56">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Cerca nella collezione…"
        aria-label="Cerca nella tua collezione"
        className="h-10 w-full rounded border-0 border-b-2 border-transparent bg-muted pr-3 pl-9 text-sm focus-visible:border-b-primary focus-visible:outline-none"
      />
    </div>
  )
}

function CardsGrid({ filters }: { filters: CardFilters }) {
  const { data } = useSuspenseQuery(cardsQueryOptions(filters))
  const [page, setPage] = useState(1)

  if (data.total === 0) {
    return (
      <EmptyState
        title="La tua collezione è vuota"
        message="Sfoglia le espansioni di One Piece e aggiungi le carte che possiedi."
        showCta
      />
    )
  }

  if (data.cards.length === 0) {
    return (
      <EmptyState
        title="Nessuna carta trovata"
        message="Nessuna carta corrisponde ai filtri selezionati. Prova a modificare la ricerca."
      />
    )
  }

  const pageCount = Math.ceil(data.cards.length / PAGE_SIZE)
  const currentPage = Math.min(page, pageCount)
  const visibleCards = data.cards.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  return (
    <>
      <p className="mt-6 text-xs text-muted-foreground" aria-live="polite">
        {data.cards.length}{' '}
        {data.cards.length === 1 ? 'carta trovata' : 'carte trovate'}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 xl:grid-cols-5">
        {visibleCards.map((card) => (
          <CardTile key={card.id} card={card} />
        ))}
      </div>
      <Pagination
        page={currentPage}
        pageCount={pageCount}
        onPageChange={setPage}
      />
    </>
  )
}

function EmptyState({
  title,
  message,
  showCta = false,
}: {
  title: string
  message: string
  showCta?: boolean
}) {
  return (
    <div className="mt-16 flex flex-col items-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Layers className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="mt-5 font-display text-xl font-bold">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
      {showCta && (
        <Link to="/browse/$game" params={{ game: 'onepiece' }} className="mt-6">
          <Button>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Sfoglia le collezioni
          </Button>
        </Link>
      )}
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <CardTileSkeleton key={i} />
      ))}
    </div>
  )
}

function CollectionValuePanel() {
  const { data } = useSuspenseQuery(collectionValueQueryOptions())
  if (data.pricedCards === 0 && data.unpricedCards === 0) return null

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-primary/5 p-5">
      <div>
        <p className="label-caps text-muted-foreground">
          Valore stimato della collezione
        </p>
        <p className="mt-1 font-display text-3xl font-extrabold text-primary">
          {formatEur(data.totalEur)}
        </p>
      </div>
      <p className="max-w-xs text-xs text-muted-foreground">
        {data.unpricedCards > 0
          ? `${data.unpricedCards} carte senza prezzo disponibile. `
          : ''}
        Prezzi One Piece da OPTCG
        {data.lastPriceDate
          ? ` · aggiornati al ${formatDate(data.lastPriceDate)}`
          : ' · aggiornati una volta al giorno'}
        .
      </p>
    </div>
  )
}

function CollectionValueSkeleton() {
  return (
    <div className="mt-6 h-24 animate-pulse rounded-lg border border-border/60 bg-surface-dim" />
  )
}
