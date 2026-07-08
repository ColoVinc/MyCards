import { Suspense, useState } from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Construction, Layers } from 'lucide-react'
import { AppHeader } from '#/components/app-header'
import { PAGE_SIZE, Pagination } from '#/components/ui/pagination'
import { catalogSetsQueryOptions } from '#/features/catalog/queries'
import { CATALOG_GAMES } from '#/features/catalog/server'
import { COLLECTION_LABELS } from '#/features/cards/validation'
import { COLLECTIONS } from '#/db/schema'
import type { CatalogGame } from '#/features/catalog/server'
import type { CollectionId } from '#/db/schema'

export const Route = createFileRoute('/_authed/browse/$game/')({
  params: {
    parse: (params) => {
      if (!COLLECTIONS.includes(params.game as CollectionId)) {
        throw notFound()
      }
      return { game: params.game as CollectionId }
    },
  },
  loader: ({ context, params }) => {
    if (CATALOG_GAMES.includes(params.game as CatalogGame)) {
      context.queryClient.prefetchQuery(
        catalogSetsQueryOptions(params.game as CatalogGame),
      )
    }
  },
  component: BrowseGamePage,
})

function BrowseGamePage() {
  const { user } = Route.useRouteContext()
  const { game } = Route.useParams()

  return (
    <div className="min-h-screen">
      <AppHeader user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <p className="label-caps text-primary">Archivio collezione</p>
        <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
          {COLLECTION_LABELS[game]}
        </h1>

        {CATALOG_GAMES.includes(game as CatalogGame) ? (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              Sfoglia le espansioni e aggiungi le carte che possiedi alla tua
              collezione.
            </p>
            <Suspense fallback={<SetsSkeleton />}>
              <SetsGrid game={game as CatalogGame} />
            </Suspense>
          </>
        ) : (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-bright/20 text-gold">
              <Construction className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-5 font-display text-xl font-bold">
              Archivio in arrivo
            </h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Il catalogo Calciatori Panini non è ancora disponibile. Stiamo
              lavorando per aggiungere anche questa collezione.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

function SetsGrid({ game }: { game: CatalogGame }) {
  const { data: sets } = useSuspenseQuery(catalogSetsQueryOptions(game))
  const [page, setPage] = useState(1)

  if (sets.length === 0) {
    return (
      <p className="mt-16 text-center text-sm text-muted-foreground">
        Nessuna espansione disponibile al momento: la sorgente dati potrebbe
        essere irraggiungibile. Riprova più tardi.
      </p>
    )
  }

  const pageCount = Math.ceil(sets.length / PAGE_SIZE)
  const currentPage = Math.min(page, pageCount)
  const visibleSets = sets.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  return (
    <>
      <p className="mt-6 text-xs text-muted-foreground">
        {sets.length} espansioni
      </p>
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
        {visibleSets.map((set) => (
          <Link
            key={set.id}
            to="/browse/$game/$setId"
            params={{ game, setId: set.externalId }}
            className="card-lift group block rounded-lg border border-border/60 bg-card p-5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <div className="flex h-20 items-center justify-center">
              {set.logoUrl || set.symbolUrl ? (
                <img
                  src={set.logoUrl ?? set.symbolUrl ?? ''}
                  alt=""
                  loading="lazy"
                  className="max-h-20 max-w-full object-contain"
                />
              ) : (
                <Layers
                  className="h-10 w-10 text-primary/30"
                  aria-hidden="true"
                />
              )}
            </div>
            <h2 className="mt-4 truncate text-center font-display text-sm font-bold group-hover:text-primary">
              {set.name}
            </h2>
            <p className="label-caps mt-2 text-center text-muted-foreground">
              {/* Codice del set sempre visibile; il conteggio carte si aggiunge
                  quando il set è stato sincronizzato (cardCount > 0). */}
              {set.externalId}
              {set.cardCount > 0 ? ` · ${set.cardCount} carte` : ''}
            </p>
          </Link>
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

function SetsSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-lg border border-border/60 bg-surface-dim"
        />
      ))}
    </div>
  )
}
