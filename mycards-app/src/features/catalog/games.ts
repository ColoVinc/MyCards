/** Giochi con una sorgente catalogo attiva (Panini è in standby). */
export const CATALOG_GAMES = ['pokemon', 'onepiece'] as const
export type CatalogGame = (typeof CATALOG_GAMES)[number]
