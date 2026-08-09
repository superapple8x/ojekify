import { useState } from 'react'
import { cn } from '../lib/cn'

export type StarRatingSize = 'sm' | 'md' | 'lg'

const sizeClasses: Record<StarRatingSize, string> = {
  sm: 'size-3.5',
  md: 'size-5',
  lg: 'size-6',
}

const STAR_KEYS = [0, 1, 2, 3, 4] as const

export interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: StarRatingSize
  disabled?: boolean
  className?: string
}

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 0 0 .95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 0 0-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 0 0-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 0 0-.363-1.118L2.075 10.1c-.783-.57-.38-1.81.588-1.81h4.915a1 1 0 0 0 .951-.69l1.519-4.674Z"
      />
    </svg>
  )
}

export function StarRating({
  value,
  onChange,
  size = 'md',
  disabled = false,
  className,
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null)
  const interactive = Boolean(onChange) && !disabled
  const display = hover ?? value
  const pct = Math.max(0, Math.min(5, display)) * 20

  const row = (tone: string) => (
    <div className="flex shrink-0">
      {STAR_KEYS.map((i) => (
        <Star key={i} className={cn(sizeClasses[size], tone)} />
      ))}
    </div>
  )

  return (
    <div
      className={cn('relative inline-block align-middle', className)}
      role={interactive ? undefined : 'img'}
      aria-label={interactive ? undefined : `Rating ${value} dari 5`}
      onMouseLeave={() => setHover(null)}
    >
      {row('text-neutral-200 dark:text-neutral-700')}
      <div
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${pct}%` }}
        aria-hidden
      >
        {row('text-amber-400')}
      </div>
      {interactive && (
        <div className="absolute inset-0 flex">
          {STAR_KEYS.map((i) => (
            <button
              key={i}
              type="button"
              className="flex-1 cursor-pointer"
              aria-label={`Beri ${i + 1} dari 5 bintang`}
              onMouseEnter={() => setHover(i + 1)}
              onClick={() => onChange?.(i + 1)}
            />
          ))}
        </div>
      )}
    </div>
  )
}