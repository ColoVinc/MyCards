import { rarityTier } from '#/features/cards/rarity'
import { cn } from '#/lib/utils'

const TIER_CLASSES = {
  common: 'bg-primary text-primary-foreground',
  rare: 'bg-impact-bright text-white',
  mythic: 'bg-gold-bright text-ink',
} as const

export function RarityChip({
  rarity,
  className,
}: {
  rarity: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'label-caps inline-flex items-center rounded-xl px-2.5 py-1.5',
        TIER_CLASSES[rarityTier(rarity)],
        className,
      )}
    >
      {rarity}
    </span>
  )
}
