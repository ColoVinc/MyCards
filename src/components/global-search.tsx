import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ImageOff, Loader2, Search } from 'lucide-react'
import { catalogSearchQueryOptions } from '#/features/catalog/queries'
import { COLLECTION_LABELS } from '#/features/cards/validation'
import type { CatalogGame } from '#/features/catalog/server'

/**
 * Ricerca globale nel catalogo: digitando nome o codice compare un pannello
 * di risultati; selezionandone uno si apre il dettaglio della carta.
 */
export function GlobalSearch() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounce: non interrogare il server ad ogni tasto.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value.trim()), 250)
    return () => clearTimeout(id)
  }, [value])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const { data: results = [], isFetching } = useQuery(
    catalogSearchQueryOptions(debounced),
  )

  const showPanel = open && debounced.length >= 2

  function goTo(game: CatalogGame, externalId: string) {
    setOpen(false)
    setValue('')
    navigate({
      to: '/catalog/$game/$cardId',
      params: { game, cardId: externalId },
    })
  }

  return (
    <div ref={containerRef} className="relative ml-auto w-full max-w-md flex-1">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Cerca una carta per nome o codice…"
          aria-label="Ricerca globale carte"
          className="h-10 w-full rounded-full border border-border/60 bg-card pr-9 pl-9 text-sm shadow-sm placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        />
        {isFetching && showPanel && (
          <Loader2
            className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </div>

      {showPanel && (
        <div
          role="listbox"
          className="glass absolute top-12 right-0 left-0 z-50 max-h-[70vh] overflow-y-auto rounded-md border border-border/60 p-2 shadow-xl"
        >
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              {isFetching ? 'Ricerca…' : 'Nessuna carta trovata.'}
            </p>
          ) : (
            results.map((card) => (
              <button
                key={card.id}
                role="option"
                aria-selected={false}
                onClick={() => goTo(card.game, card.externalId)}
                className="flex w-full cursor-pointer items-center gap-3 rounded px-2 py-2 text-left transition-colors hover:bg-primary/5"
              >
                <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-surface-dim">
                  {card.imageUrl ? (
                    <img
                      src={card.imageUrl}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <ImageOff
                      className="absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-sm font-bold">
                    {card.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {COLLECTION_LABELS[card.game]}
                    {card.number ? ` · #${card.number}` : ''} · {card.setName}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
