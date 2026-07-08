export type RarityTier = 'common' | 'rare' | 'mythic'

/**
 * Mappa una rarità libera sui tre accenti del design system:
 * blu (common), rosso (rare), oro (mythic/legendary).
 */
export function rarityTier(rarity: string): RarityTier {
  const r = rarity.toLowerCase()
  if (
    r.includes('secret') ||
    r.includes('segreta') ||
    r.includes('ultra') ||
    r.includes('leader') ||
    r.includes('limited') ||
    r.includes('leggendaria') ||
    r.includes('mythic')
  ) {
    return 'mythic'
  }
  if (
    r.includes('rara') ||
    r.includes('rare') ||
    r.includes('holo') ||
    r.includes('foil') ||
    r.includes('super') ||
    r.includes('speciale')
  ) {
    return 'rare'
  }
  return 'common'
}
