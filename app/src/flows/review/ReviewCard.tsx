import { useState } from 'react'
import type { IndividualReview, ServiceId, VibeTag } from '../../api'
import { Badge, Card, Tag } from '../../components'
import { cn } from '../../lib/cn'
import { formatTimeAgo } from '../../lib/format'

const SERVICE_META: Record<ServiceId, { emoji: string; label: string }> = {
  ride: { emoji: '🛺', label: 'Ride' },
  food: { emoji: '🍔', label: 'Food' },
  send: { emoji: '📦', label: 'Send' },
  print: { emoji: '🖨️', label: 'Print' },
  jasa: { emoji: '🔧', label: 'Jasa' },
}

function formatHour(hour: number): string {
  const h = hour % 24
  return `${String(h).padStart(2, '0')}:00`
}

function isNight(hour: number): boolean {
  const h = hour % 24
  return h >= 21 || h < 5
}

function isRaining(weather: string): boolean {
  return weather.toLowerCase().includes('hujan')
}

function adminResponseMeta(minutes: number): { label: string; color: string } {
  if (minutes <= 3)
    return {
      label: `⚡ Fast (${minutes} mnt)`,
      color: 'text-emerald-700 dark:text-emerald-300',
    }
  if (minutes <= 10)
    return {
      label: `🕑 Standar (${minutes} mnt)`,
      color: 'text-amber-700 dark:text-amber-300',
    }
  return {
    label: `🐢 Lambat (${minutes} mnt)`,
    color: 'text-red-600 dark:text-red-400',
  }
}

export interface ReviewCardProps {
  review: IndividualReview
  providerTags: VibeTag[]
}

export function ReviewCard({ review, providerTags }: ReviewCardProps) {
  const [showAllPhotos, setShowAllPhotos] = useState(false)

  const service = SERVICE_META[review.serviceType] ?? SERVICE_META.ride
  const night = isNight(review.orderTime)
  const rain = isRaining(review.weather)
  const admin = adminResponseMeta(review.adminResponseMinutes)
  const photos = review.photos.filter(Boolean)
  const visiblePhotos = showAllPhotos ? photos : photos.slice(0, 3)

  const resolvedTags = review.tagIds
    .map((id) => providerTags.find((t) => t.id === id))
    .filter(Boolean) as VibeTag[]

  return (
    <Card padding="md" className="space-y-3">
      {/* 1. Order Context Banner */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="brand">
          {service.emoji} {service.label}
        </Badge>
        {night && (
          <Badge tone="warning">
            🌙 {formatHour(review.orderTime)}
          </Badge>
        )}
        {!night && (
          <Badge tone="gray">
            🕐 {formatHour(review.orderTime)}
          </Badge>
        )}
        {rain && <Badge tone="brand">🌧️ Hujan</Badge>}
        {review.pickupZone && review.dropoffZone && (
          <Badge tone="gray">
            {review.pickupZone} ➡️ {review.dropoffZone}
          </Badge>
        )}
      </div>

      {/* 2. Who Handled It */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="font-semibold text-neutral-700 dark:text-neutral-200">
          🏍️ Driver:{' '}
          {review.anonymous ? (
            <span className="italic text-neutral-400 dark:text-neutral-500">Anonim</span>
          ) : (
            review.driverName || <span className="italic text-neutral-400 dark:text-neutral-500">-</span>
          )}
        </span>
        <span className={cn('font-semibold', admin.color)}>
          Admin: {admin.label}
        </span>
      </div>

      {/* 3. Photo Evidence */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <div className="flex gap-2 overflow-x-auto">
            {visiblePhotos.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Bukti foto ${i + 1}`}
                className="h-24 w-24 shrink-0 rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10"
                loading="lazy"
              />
            ))}
          </div>
          {photos.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllPhotos((v) => !v)}
              className="text-[11px] font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              {showAllPhotos ? 'Sembunyikan' : `Lihat semua foto (${photos.length})`}
            </button>
          )}
        </div>
      )}

      {/* 4. Price Honesty Indicator */}
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold',
          review.priceMatch
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
            : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
        )}
      >
        <span className="text-base" aria-hidden>
          {review.priceMatch ? '✅' : '❌'}
        </span>
        {review.priceMatch ? (
          <span>Sesuai Aplikasi</span>
        ) : (
          <span>Diminta Tambahan{review.priceNote ? `: ${review.priceNote}` : ''}</span>
        )}
      </div>

      {/* 5. Written Review & Vibe Tags */}
      {review.textReview && (
        <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
          &ldquo;{review.textReview}&rdquo;
        </p>
      )}

      {resolvedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {resolvedTags.map((tag) => (
            <Tag
              key={tag.id}
              variant={tag.kind === 'positive' ? 'success' : 'warning'}
            >
              {tag.label}
            </Tag>
          ))}
        </div>
      )}

      {/* Timestamp */}
      <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
        {formatTimeAgo(review.createdAt)}
        {review.anonymous && ' · Ditulis sebagai anonim'}
      </p>
    </Card>
  )
}
