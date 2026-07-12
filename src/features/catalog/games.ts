/** Giochi con una sorgente catalogo attiva. Per ora solo One Piece. */
export const CATALOG_GAMES = ['onepiece'] as const
export type CatalogGame = (typeof CATALOG_GAMES)[number]
