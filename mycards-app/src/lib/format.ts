const eurFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
})

/** Formatta un valore in euro, es. 1234.5 → "1.234,50 €". */
export function formatEur(value: number): string {
  return eurFormatter.format(value)
}
