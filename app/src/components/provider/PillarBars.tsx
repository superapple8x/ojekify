import { useEffect, useState } from 'react'
import { Banknote, Package, Timer, type LucideIcon } from 'lucide-react'
import type { ReviewPillars } from '../../api'
import { cn } from '../../lib/cn'
import { useCountUp } from '../../hooks/useCountUp'

export interface PillarBarsProps {
  pillars: ReviewPillars
  className?: string
}

interface PillarMeta {
  key: keyof ReviewPillars
  label: string
  question: string
  icon: LucideIcon
  barClass: string
}

const PILLAR_META: PillarMeta[] = [
  {
    key: 'speed',
    label: 'Speed',
    question: 'Sampai sebelum deadline?',
    icon: Timer,
    barClass: 'bg-sky-500 dark:bg-sky-400',
  },
  {
    key: 'itemSafety',
    label: 'Item Safety',
    question: 'Barang aman, tidak tumpah atau kusut?',
    icon: Package,
    barClass: 'bg-brand-500 dark:bg-brand-400',
  },
  {
    key: 'priceHonesty',
    label: 'Price Honesty',
    question: 'Harga sesuai app, tanpa uang tambahan?',
    icon: Banknote,
    barClass: 'bg-accent-500 dark:bg-accent-400',
  },
]

function useGrown() {
  const [grown, setGrown] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setGrown(true)
      return
    }
    const frame = requestAnimationFrame(() => setGrown(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return grown
}

function PillarRow({ meta, value }: { meta: PillarMeta; value: number }) {
  const Icon = meta.icon
  const grown = useGrown()
  const animatedValue = useCountUp(value)
  const pct = Math.max(0, Math.min(100, (value / 5) * 100))

  return (
    <li className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1.5 text-sm font-bold">
          <Icon className="size-4 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden />
          {meta.label}
        </p>
        <span className="shrink-0 text-sm font-extrabold tabular-nums">
          {animatedValue.toFixed(1)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={Number(value.toFixed(1))}
        aria-label={`${meta.label}: ${value.toFixed(1)} dari 5`}
        className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none',
            meta.barClass,
          )}
          style={{ width: `${grown ? pct : 0}%` }}
        />
      </div>
      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{meta.question}</p>
    </li>
  )
}

export function PillarBars({ pillars, className }: PillarBarsProps) {
  return (
    <ul className={cn('space-y-4', className)}>
      {PILLAR_META.map((meta) => (
        <PillarRow key={meta.key} meta={meta} value={pillars[meta.key]} />
      ))}
    </ul>
  )
}
