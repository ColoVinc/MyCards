import { Link } from '@tanstack/react-router'
import { RarityChip } from '#/components/rarity-chip'
import { COLLECTION_LABELS } from '#/features/cards/validation'
import { formatDateShort, formatEur } from '#/lib/format'
import type { CardWithPrice } from '#/features/cards/server'

export function CardTile({ card }: { card: CardWithPrice }) {
  return (
    <Link
      to="/cards/$cardId"
      params={{ cardId: card.id }}
      className="group block focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-label={`${card.name}, ${COLLECTION_LABELS[card.collection]}, rarità ${card.rarity}${card.quantity > 1 ? `, ${card.quantity} copie` : ''}`}
    >
      <article className="card-lift card-gloss overflow-hidden rounded-lg border border-border/60 bg-card">
        <div className="relative aspect-[2.5/3.5] bg-surface-dim">
          <img
            src={card.frontImageUrl}
            alt={`Fronte della carta ${card.name}`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <RarityChip rarity={card.rarity} className="absolute top-2 right-2" />
          {card.quantity > 1 && (
            <span className="label-caps absolute top-2 left-2 rounded-xl bg-ink/80 px-2 py-1.5 text-white">
              ×{card.quantity}
            </span>
          )}
        </div>
        <div className="space-y-1 p-3">
          <h3 className="truncate font-display text-sm font-bold">
            {card.name}
            {card.quantity > 1 && (
              <span className="ml-1.5 font-label text-xs font-bold text-primary">
                ×{card.quantity}
              </span>
            )}
          </h3>
          <div className="flex items-center justify-between gap-2">
            <span className="label-caps text-muted-foreground">
              {COLLECTION_LABELS[card.collection]}
            </span>
            {card.cardNumber && (
              <span className="font-label text-xs font-medium text-outline-soft">
                #{card.cardNumber}
              </span>
            )}
          </div>
          {card.priceEur !== null && (
            <div>
              <p className="font-display text-sm font-bold text-primary">
                {formatEur(card.priceEur)}
              </p>
              {card.priceScrapedAt && (
                <p className="text-[0.65rem] leading-tight text-muted-foreground">
                  agg. {formatDateShort(card.priceScrapedAt)}
                </p>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}

export function CardTileSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
      <div className="aspect-[2.5/3.5] animate-pulse bg-surface-dim" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-surface-dim" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-surface-dim" />
      </div>
    </div>
  )
}
