const eurFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
})

/** Formatta un valore in euro, es. 1234.5 → "1.234,50 €". */
export function formatEur(value: number): string {
  return eurFormatter.format(value)
}

const dateLongFormatter = new Intl.DateTimeFormat('it-IT', {
  dateStyle: 'long',
})
const dateShortFormatter = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

// Le date "solo giorno" (YYYY-MM-DD) vanno ancorate alla mezzanotte LOCALE:
// `new Date('2026-07-12')` sarebbe UTC e in certi fusi mostrerebbe il giorno
// prima.
function toLocalDate(value: string | Date): Date {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value)
}

/** Data estesa, es. "12 luglio 2026". */
export function formatDate(value: string | Date): string {
  return dateLongFormatter.format(toLocalDate(value))
}

/** Data compatta, es. "12 lug 2026". */
export function formatDateShort(value: string | Date): string {
  return dateShortFormatter.format(toLocalDate(value))
}
