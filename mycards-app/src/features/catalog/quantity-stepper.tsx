import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Minus, Plus } from 'lucide-react'
import { adjustCatalogCardFn } from '#/features/catalog/server'

/**
 * Contatore copie di una carta del catalogo: −  N  +.
 * Ogni variazione fa upsert lato server (nessuna riga duplicata) e la nuova
 * quantità autorevole arriva dalla risposta. A 0 la carta esce dalla collezione.
 */
export function QuantityStepper({
  catalogCardId,
  quantity,
  onChange,
  size = 'md',
}: {
  catalogCardId: string
  quantity: number
  onChange?: (quantity: number) => void
  size?: 'sm' | 'md'
}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (delta: 1 | -1) =>
      adjustCatalogCardFn({ data: { catalogCardId, delta } }),
    onSuccess: (result) => {
      onChange?.(result.quantity)
      void queryClient.invalidateQueries({ queryKey: ['cards'] })
      void queryClient.invalidateQueries({ queryKey: ['catalog', 'owned'] })
    },
  })

  const dim = size === 'sm' ? 'h-8 w-8' : 'h-11 w-11'
  const text = size === 'sm' ? 'text-base' : 'text-xl'

  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={() => mutation.mutate(-1)}
        disabled={mutation.isPending || quantity <= 0}
        aria-label="Rimuovi una copia"
        className={`flex ${dim} cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>

      <span
        className={`font-label ${text} min-w-8 text-center font-bold tabular-nums`}
        aria-live="polite"
        aria-label={`${quantity} copie possedute`}
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={() => mutation.mutate(1)}
        disabled={mutation.isPending}
        aria-label="Aggiungi una copia"
        className={`flex ${dim} cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-bright disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
