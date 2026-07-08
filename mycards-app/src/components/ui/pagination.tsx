import { ChevronLeft, ChevronRight } from 'lucide-react'

/** Numero massimo di elementi mostrati per pagina (carte o collezioni). */
export const PAGE_SIZE = 20

/**
 * Calcola i numeri di pagina da mostrare, con ellissi (es. 1 … 4 5 6 … 12).
 * Restituisce numeri di pagina (1-based) e 'ellipsis' come separatori.
 */
function getPageItems(
  page: number,
  pageCount: number,
): Array<number | 'ellipsis'> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }
  const items: Array<number | 'ellipsis'> = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(pageCount - 1, page + 1)
  if (start > 2) items.push('ellipsis')
  for (let i = start; i <= end; i++) items.push(i)
  if (end < pageCount - 1) items.push('ellipsis')
  items.push(pageCount)
  return items
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}) {
  if (pageCount <= 1) return null

  const items = getPageItems(page, pageCount)

  return (
    <nav
      aria-label="Paginazione"
      className="mt-8 flex items-center justify-center gap-1"
    >
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Pagina precedente"
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md bg-secondary text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>

      {items.map((item, index) =>
        item === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            className="px-1 text-muted-foreground"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onPageChange(item)}
            aria-label={`Pagina ${item}`}
            aria-current={item === page ? 'page' : undefined}
            className={`label-caps h-9 min-w-9 cursor-pointer rounded-md px-2 transition-colors ${
              item === page
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-accent'
            }`}
          >
            {item}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        aria-label="Pagina successiva"
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md bg-secondary text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  )
}
