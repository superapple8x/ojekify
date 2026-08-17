import type { ServiceId } from '../../api'
import { Chip } from '../../components'

export type ContextFilter = 'lateNight' | 'rainyDay'
export type SortOption = 'newest' | 'highest' | 'lowest'

export interface ReviewFilterState {
  serviceType: ServiceId | 'all'
  context: ContextFilter[]
  hasPhotos: boolean
  sort: SortOption
}

export interface ReviewFiltersProps {
  filters: ReviewFilterState
  onFiltersChange: (filters: ReviewFilterState) => void
}

const SERVICE_OPTIONS: { id: ServiceId | 'all'; label: string; emoji: string }[] = [
  { id: 'all', label: 'Semua', emoji: '📋' },
  { id: 'ride', label: 'Ride', emoji: '🛵' },
  { id: 'food', label: 'Food', emoji: '🍜' },
  { id: 'print', label: 'Print', emoji: '🖨️' },
  { id: 'jasa', label: 'Galon/Gas', emoji: '💧' },
]

const CONTEXT_OPTIONS: { id: ContextFilter; label: string; emoji: string }[] = [
  { id: 'lateNight', label: 'Late Night', emoji: '🌙' },
  { id: 'rainyDay', label: 'Rainy Day', emoji: '🌧️' },
]

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'newest', label: 'Terbaru' },
  { id: 'highest', label: 'Rating Tertinggi' },
  { id: 'lowest', label: 'Rating Terendah' },
]

export function ReviewFilters({ filters, onFiltersChange }: ReviewFiltersProps) {
  const setService = (serviceType: ServiceId | 'all') =>
    onFiltersChange({ ...filters, serviceType })

  const toggleContext = (ctx: ContextFilter) =>
    onFiltersChange({
      ...filters,
      context: filters.context.includes(ctx)
        ? filters.context.filter((c) => c !== ctx)
        : [...filters.context, ctx],
    })

  const togglePhotos = () =>
    onFiltersChange({ ...filters, hasPhotos: !filters.hasPhotos })

  const setSort = (sort: SortOption) =>
    onFiltersChange({ ...filters, sort })

  return (
    <div className="space-y-3">
      {/* Service Type */}
      <div>
        <p className="mb-1.5 text-[10px] font-bold tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
          Layanan
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SERVICE_OPTIONS.map((opt) => (
            <Chip
              key={opt.id}
              size="sm"
              selected={filters.serviceType === opt.id}
              onClick={() => setService(opt.id)}
              icon={<span aria-hidden>{opt.emoji}</span>}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Context */}
      <div>
        <p className="mb-1.5 text-[10px] font-bold tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
          Konteks
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CONTEXT_OPTIONS.map((opt) => (
            <Chip
              key={opt.id}
              size="sm"
              selected={filters.context.includes(opt.id)}
              onClick={() => toggleContext(opt.id)}
              icon={<span aria-hidden>{opt.emoji}</span>}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Media */}
      <div>
        <p className="mb-1.5 text-[10px] font-bold tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
          Media
        </p>
        <Chip
          size="sm"
          selected={filters.hasPhotos}
          onClick={togglePhotos}
          icon={<span aria-hidden>📷</span>}
        >
          Ada Foto
        </Chip>
      </div>

      {/* Sort */}
      <div>
        <label
          htmlFor="review-sort"
          className="mb-1.5 block text-[10px] font-bold tracking-wider text-neutral-400 uppercase dark:text-neutral-500"
        >
          Urutkan
        </label>
        <select
          id="review-sort"
          value={filters.sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold dark:border-neutral-700 dark:bg-neutral-900"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export function applyReviewFilters<T extends { serviceType: ServiceId; weather: string; orderTime: number; photos: string[]; createdAt: number; priceMatch: boolean }>(
  reviews: T[],
  filters: ReviewFilterState,
): T[] {
  let result = [...reviews]

  // Filter by service type
  if (filters.serviceType !== 'all') {
    result = result.filter((r) => r.serviceType === filters.serviceType)
  }

  // Filter by context
  if (filters.context.includes('lateNight')) {
    result = result.filter((r) => {
      const h = r.orderTime % 24
      return h >= 21 || h < 5
    })
  }
  if (filters.context.includes('rainyDay')) {
    result = result.filter((r) => r.weather.toLowerCase().includes('hujan'))
  }

  // Filter by photos
  if (filters.hasPhotos) {
    result = result.filter((r) => r.photos.filter(Boolean).length > 0)
  }

  // Sort
  switch (filters.sort) {
    case 'newest':
      result.sort((a, b) => b.createdAt - a.createdAt)
      break
    case 'highest':
      result.sort((a, b) => {
        if (a.priceMatch !== b.priceMatch) return a.priceMatch ? -1 : 1
        return b.createdAt - a.createdAt
      })
      break
    case 'lowest':
      result.sort((a, b) => {
        if (a.priceMatch !== b.priceMatch) return a.priceMatch ? 1 : -1
        return a.createdAt - b.createdAt
      })
      break
  }

  return result
}
