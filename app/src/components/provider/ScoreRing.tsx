import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface ScoreRingProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  children?: ReactNode
}

const MAX_SCORE = 5

export function ScoreRing({
  value,
  size = 120,
  strokeWidth = 10,
  className,
  children,
}: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(MAX_SCORE, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const [grown, setGrown] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setGrown(true)
      return
    }
    const frame = requestAnimationFrame(() => setGrown(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const offset = circumference * (1 - (grown ? clamped : 0) / MAX_SCORE)

  return (
    <div
      className={cn('relative inline-flex shrink-0', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Skor ${clamped.toFixed(1)} dari 5`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-neutral-200 dark:stroke-neutral-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-brand-500 transition-[stroke-dashoffset] duration-1000 ease-out dark:stroke-brand-400"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children ?? (
          <span className="text-2xl font-extrabold tracking-tight tabular-nums">
            {clamped.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  )
}
