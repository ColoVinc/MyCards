import { z } from 'zod'
import { COLLECTIONS } from '#/db/schema'

export const COLLECTION_LABELS: Record<(typeof COLLECTIONS)[number], string> = {
  onepiece: 'One Piece',
}

/** Rarità One Piece che attivano l'effetto olografico nel viewer 3D. */
export const FOIL_RARITIES = new Set(
  ['super rare', 'secret rare', 'leader', 'special', 'treasure rare'].map((r) =>
    r.toLowerCase(),
  ),
)

export function isFoilRarity(rarity: string): boolean {
  const r = rarity.toLowerCase()
  return (
    FOIL_RARITIES.has(r) ||
    r.includes('foil') ||
    r.includes('rare') ||
    r.includes('secret') ||
    r.includes('leader')
  )
}

export const SORT_OPTIONS = [
  'date-desc',
  'date-asc',
  'name-asc',
  'name-desc',
  'rarity',
] as const

export type SortOption = (typeof SORT_OPTIONS)[number]

export const SORT_LABELS: Record<SortOption, string> = {
  'date-desc': 'Più recenti',
  'date-asc': 'Meno recenti',
  'name-asc': 'Nome A-Z',
  'name-desc': 'Nome Z-A',
  rarity: 'Rarità',
}

export const cardFiltersSchema = z.object({
  q: z.string().trim().max(120).optional().catch(undefined),
  collection: z
    .enum([...COLLECTIONS, 'all'] as const)
    .optional()
    .catch(undefined),
  rarity: z.string().trim().max(60).optional().catch(undefined),
  sort: z.enum(SORT_OPTIONS).optional().catch(undefined),
})

export type CardFilters = z.infer<typeof cardFiltersSchema>
