import { Link } from '@tanstack/react-router'
import { cn } from '#/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        'flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-primary',
        className,
      )}
      aria-label="MyCards - Home"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="5"
          width="11"
          height="15"
          rx="2"
          transform="rotate(-8 3 5)"
          fill="currentColor"
          opacity="0.35"
        />
        <rect
          x="8"
          y="4"
          width="11"
          height="15"
          rx="2"
          transform="rotate(6 8 4)"
          fill="currentColor"
        />
      </svg>
      MyCards
    </Link>
  )
}
