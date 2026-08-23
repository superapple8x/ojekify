import { useMemo } from 'react'
import { Banknote, Package, Timer, type LucideIcon } from 'lucide-react'
import type {
  IndividualReview,
  ItemSafetyRating,
  PriceHonestyRating,
  SpeedRating,
} from '../../api'
import { cn } from '../../lib/cn'

export interface RatingBreakdownProps {
  reviews: IndividualReview[]
  className?: string
}

type Tone = 'good' | 'mid' | 'bad'

interface ToneCount {
  good: number
  mid: number
  bad: number
}

interface BreakdownMeta {
  key: string
  label: string
  icon: LucideIcon
  toneOf: (review: IndividualReview) => Tone
}

const SEGMENT_CLASSES: Record<Tone, string> = {
  good: 'bg-emerald-500 dark:bg-emerald-400',
  mid: 'bg-accent-400 dark:bg-accent-300',
  bad: 'bg-red-500 dark:bg-red-400',
}

const DOT_CLASSES = SEGMENT_CLASSES

const SPEED_TONE: Record<SpeedRating, Tone> = {
  lambat: 'bad',
  standar: 'mid',
  ngebut: 'good',
}

const SAFETY_TONE: Record<ItemSafetyRating, Tone> = {
  berantakan: 'bad',
  aman: 'mid',
  sempurna: 'good',
}

const PRICE_TONE: Record<PriceHonestyRating, Tone> = {
  'minta-ekstra': 'bad',
  'sesuai-app': 'good',
}

const BREAKDOWN_META: BreakdownMeta[] = [
  { key: 'speed', label: 'Speed', icon: Timer, toneOf: (r) => SPEED_TONE[r.speed] },
  {
    key: 'itemSafety',
    label: 'Item Safety',
    icon: Package,
    toneOf: (r) => SAFETY_TONE[r.itemSafety],
  },
  {
    key: 'priceHonesty',
    label: 'Price Honesty',
    icon: Banknote,
    toneOf: (r) => PRICE_TONE[r.priceHonesty],
  },
]

const LEVEL_LABELS: Record<string, Record<Tone, string>> = {
  speed: { good: 'ngebut', mid: 'standar', bad: 'lambat' },
  itemSafety: { good: 'sempurna', mid: 'aman', bad: 'berantakan' },
  priceHonesty: { good: 'sesuai app', mid: '', bad: 'minta ekstra' },
}

const TONE_ORDER: Tone[] = ['good', 'mid', 'bad']

function countTones(reviews: IndividualReview[], meta: BreakdownMeta): ToneCount {
  const counts: ToneCount = { good: 0, mid: 0, bad: 0 }
  for (const review of reviews) counts[meta.toneOf(review)] += 1
  return counts
}

function BreakdownRow({
  meta,
  counts,
  total,
}: {
  meta: BreakdownMeta
  counts: ToneCount
  total: number
}) {
  const Icon = meta.icon
  const labels = LEVEL_LABELS[meta.key]

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1.5 text-sm font-bold">
          <Icon className="size-4 shrink-0 text-neutral-500 dark:text-neutral-400" aria-hidden />
          {meta.label}
        </p>
        <div className="flex shrink-0 items-center gap-2.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
          {TONE_ORDER.filter((tone) => counts[tone] > 0 && labels[tone]).map((tone) => (
            <span key={tone} className="flex items-center gap-1">
              <span aria-hidden className={cn('size-1.5 rounded-full', DOT_CLASSES[tone])} />
              {counts[tone]} {labels[tone]}
            </span>
          ))}
        </div>
      </div>
      <div
        role="img"
        aria-label={`${meta.label}: ${counts.good} positif, ${counts.mid} standar, ${counts.bad} buruk dari ${total} ulasan`}
        className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
      >
        {TONE_ORDER.filter((tone) => counts[tone] > 0).map((tone) => (
          <div
            key={tone}
            className={cn('h-full first:rounded-l-full last:rounded-r-full', SEGMENT_CLASSES[tone])}
            style={{ flexGrow: counts[tone], flexBasis: 0 }}
          />
        ))}
      </div>
    </div>
  )
}

export function RatingBreakdown({ reviews, className }: RatingBreakdownProps) {
  const breakdowns = useMemo(
    () => BREAKDOWN_META.map((meta) => ({ meta, counts: countTones(reviews, meta) })),
    [reviews],
  )

  if (reviews.length === 0) return null

  return (
    <div className={cn('space-y-4', className)}>
      {breakdowns.map(({ meta, counts }) => (
        <BreakdownRow key={meta.key} meta={meta} counts={counts} total={reviews.length} />
      ))}
      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
        Sebaran penilaian dari {reviews.length} ulasan mahasiswa.
      </p>
    </div>
  )
}
