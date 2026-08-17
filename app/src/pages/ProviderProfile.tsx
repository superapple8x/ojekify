import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, type IndividualReview, type Provider, type ProviderReview, type ReviewPillars } from '../api'
import { ReviewForm } from '../flows/review/ReviewForm'
import { ReviewFilters, applyReviewFilters, type ReviewFilterState } from '../flows/review/ReviewFilters'
import { ReviewCard } from '../flows/review/ReviewCard'
import { ReportIssueCard } from '../flows/review/ReportIssueCard'
import { GhostWarningBanner } from '../flows/review/GhostWarningBanner'
import {
  Button,
  Card,
  EmptyState,
  ProviderAvatar,
  SkeletonLines,
  SkeletonProviderRow,
  StarRating,
  Tag,
  TierBadge,
} from '../components'

const PILLAR_META: { key: keyof ReviewPillars; label: string; question: string; emoji: string }[] = [
  {
    key: 'speed',
    label: 'Speed',
    question: 'Sampai sebelum deadline?',
    emoji: '⏱️',
  },
  {
    key: 'itemSafety',
    label: 'Item Safety',
    question: 'Barang aman, tidak tumpah atau kusut?',
    emoji: '📦',
  },
  {
    key: 'priceHonesty',
    label: 'Price Honesty',
    question: 'Harga sesuai app, tanpa uang tambahan?',
    emoji: '💸',
  },
]

const DEFAULT_FILTERS: ReviewFilterState = {
  serviceType: 'all',
  context: [],
  hasPhotos: false,
  sort: 'newest',
}

export default function ProviderProfile() {
  const { id } = useParams<{ id: string }>()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [review, setReview] = useState<ProviderReview | null>(null)
  const [individualReviews, setIndividualReviews] = useState<IndividualReview[]>([])
  const [filters, setFilters] = useState<ReviewFilterState>(DEFAULT_FILTERS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let alive = true
    setLoading(true)
    setProvider(null)
    setReview(null)
    setIndividualReviews([])
    setFilters(DEFAULT_FILTERS)
    Promise.all([api.getProvider(id), api.getReview(id), api.getIndividualReviews(id)]).then(
      ([found, foundReview, foundIndividual]) => {
        if (!alive) return
        setProvider(found ?? null)
        setReview(foundReview ?? null)
        setIndividualReviews(foundIndividual)
        setLoading(false)
      },
    )
    return () => {
      alive = false
    }
  }, [id])

  const filteredReviews = useMemo(
    () => applyReviewFilters(individualReviews, filters),
    [individualReviews, filters],
  )

  if (loading) {
    return (
      <div className="animate-fade-in space-y-5" role="status" aria-label="Memuat profil provider">
        <SkeletonProviderRow count={1} />
        <Card>
          <SkeletonLines lines={3} />
        </Card>
        <Card>
          <SkeletonLines lines={4} />
        </Card>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="animate-fade-in">
        <EmptyState
          icon="🔍"
          title="Provider tidak ditemukan"
          description="Profil provider yang kamu cari tidak ada (atau sudah dihapus). Coba bandingkan harga dulu untuk pilih provider lain."
          action={
            <Link to="/bandingkan">
              <Button variant="outline" size="sm">
                Kembali ke bandingkan
              </Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-5">
      <Link
        to="/bandingkan"
        className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 transition-colors hover:text-brand-600 dark:text-neutral-400 dark:hover:text-brand-400"
      >
        <span aria-hidden>←</span> Kembali ke hasil banding
      </Link>

      <GhostWarningBanner provider={provider} review={review} />

      <Card padding="lg">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
          <ProviderAvatar name={provider.name} emoji={provider.emoji} seed={provider.id} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-xl font-extrabold tracking-tight">{provider.name}</h1>
              <TierBadge tier={provider.tier} />
            </div>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{provider.tagline}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-start">
              <StarRating value={review?.score ?? provider.rating} size="lg" />
              <span className="text-2xl font-extrabold tracking-tight tabular-nums">
                {(review?.score ?? provider.rating).toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                · {(review?.totalRatings ?? provider.reviews).toLocaleString('id-ID')} ulasan
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl bg-neutral-100 px-3 py-2.5 text-center dark:bg-neutral-800">
            <p className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
              ⚡ Respon
            </p>
            <p className="mt-0.5 text-sm font-extrabold tabular-nums">
              ±{provider.responseTimeMinutes} mnt
            </p>
          </div>
          <div className="rounded-xl bg-neutral-100 px-3 py-2.5 text-center dark:bg-neutral-800">
            <p className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
              🕐 Jam operasional
            </p>
            <p className="mt-0.5 text-sm font-extrabold tabular-nums">{provider.openHours}</p>
          </div>
          <div
            className={`rounded-xl px-3 py-2.5 text-center ${
              provider.noHiddenFees
                ? 'bg-emerald-50 dark:bg-emerald-500/10'
                : 'bg-amber-50 dark:bg-amber-500/10'
            }`}
          >
            <p className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
              {provider.noHiddenFees ? '🛡️ Biaya' : '⚠️ Biaya'}
            </p>
            <p
              className={`mt-0.5 text-sm font-extrabold tabular-nums ${
                provider.noHiddenFees
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-amber-700 dark:text-amber-300'
              }`}
            >
              {provider.noHiddenFees ? 'Tanpa tersembunyi' : 'Bisa ada tambahan'}
            </p>
          </div>
        </div>
      </Card>

      {review && (
        <Card padding="lg">
          <h2 className="flex items-center gap-2 text-sm font-extrabold">
            <span aria-hidden>🧭</span> Rating per pilar
          </h2>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Tiga ukuran yang paling menentukan di kehidupan kampus — nilai dari ulasan mahasiswa.
          </p>
          <ul className="mt-4 space-y-3">
            {PILLAR_META.map((pillar) => (
              <li
                key={pillar.key}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-800/60"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold">
                    <span aria-hidden>{pillar.emoji}</span> {pillar.label}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {pillar.question}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating value={review.pillars[pillar.key]} size="sm" />
                  <span className="text-sm font-extrabold tabular-nums">
                    {review.pillars[pillar.key].toFixed(1)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card padding="lg">
        <h2 className="flex items-center gap-2 text-sm font-extrabold">
          <span aria-hidden>🏷️</span> Vibe tags
        </h2>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Label singkat dari sesama mahasiswa soal pengalaman pakai {provider.name}.
        </p>

        <div className="mt-4 space-y-4">
          <section aria-label="Tag positif">
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <span aria-hidden>🟢</span> Positive Tags
            </h3>
            {review && review.positiveTags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {review.positiveTags.map((tag) => (
                  <Tag key={tag.id} variant="success" icon={<span aria-hidden>✓</span>}>
                    {tag.label} · {tag.count}
                  </Tag>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs italic text-neutral-400 dark:text-neutral-500">
                Belum ada tag positif untuk provider ini.
              </p>
            )}
          </section>

          <section aria-label="Tag peringatan">
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400">
              <span aria-hidden>🔴</span> Warning Tags (Red Flags)
            </h3>
            {review && review.warningTags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {review.warningTags.map((tag) => (
                  <Tag key={tag.id} variant="danger" icon={<span aria-hidden>!</span>}>
                    {tag.label} · {tag.count}
                  </Tag>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs italic text-neutral-400 dark:text-neutral-500">
                Bersih — belum ada laporan peringatan untuk {provider.name}.
              </p>
            )}
          </section>
        </div>
      </Card>

      <ReviewForm provider={provider} />

      <ReportIssueCard provider={provider} review={review} />

      {/* Individual Reviews with Filters */}
      <Card padding="lg">
        <h2 className="flex items-center gap-2 text-sm font-extrabold">
          <span aria-hidden>💬</span> Ulasan Mahasiswa
        </h2>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {individualReviews.length} ulasan dari mahasiswa yang pernah pakai {provider.name}.
        </p>

        <div className="mt-4">
          <ReviewFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        <div className="mt-4 space-y-3">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((r) => (
              <ReviewCard key={r.id} review={r} providerTags={provider.tags} />
            ))
          ) : (
            <EmptyState
              icon="🔍"
              title="Tidak ada ulasan"
              description="Tidak ada ulasan yang cocok dengan filter yang dipilih."
            />
          )}
        </div>
      </Card>
    </div>
  )
}
