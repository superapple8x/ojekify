import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, type IndividualReview, type Provider, type ProviderReview } from '../api'
import { ReviewForm } from '../flows/review/ReviewForm'
import { ReviewFilters, applyReviewFilters, type ReviewFilterState } from '../flows/review/ReviewFilters'
import { ReviewCard } from '../flows/review/ReviewCard'
import { ReportIssueCard } from '../flows/review/ReportIssueCard'
import { GhostWarningBanner } from '../flows/review/GhostWarningBanner'
import {
  Button,
  Card,
  EmptyState,
  PillarBars,
  ProviderAvatar,
  RatingBreakdown,
  ScoreRing,
  Skeleton,
  SkeletonLines,
  Tag,
  TierBadge,
} from '../components'

const SLIDE_UP = 'animate-slide-up motion-reduce:animate-none'

const DEFAULT_FILTERS: ReviewFilterState = {
  serviceType: 'all',
  context: [],
  hasPhotos: false,
  sort: 'newest',
}

interface TagSummary {
  id: string
  label: string
  count: number
}

function sortTagsByCount(tags: TagSummary[]) {
  return [...tags].sort((a, b) => b.count - a.count)
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

  const topPositiveTags = useMemo(
    () => (review ? sortTagsByCount(review.positiveTags).slice(0, 3) : []),
    [review],
  )

  const topWarningTags = useMemo(
    () => (review ? sortTagsByCount(review.warningTags).slice(0, 3) : []),
    [review],
  )

  if (loading) {
    return (
      <div
        className="animate-fade-in mx-auto max-w-5xl space-y-5"
        role="status"
        aria-label="Memuat profil provider"
      >
        <Skeleton className="h-3.5 w-44" />
        <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          <aside className="space-y-5">
            <Card padding="lg">
              <div className="flex flex-col items-center gap-3">
                <Skeleton variant="circle" className="size-24" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
            </Card>
            <Card padding="lg">
              <div className="flex flex-col items-center gap-3">
                <Skeleton variant="circle" className="size-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </Card>
            <div className="space-y-2" aria-hidden>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          </aside>
          <div className="min-w-0 space-y-5">
            <Card padding="lg">
              <SkeletonLines lines={6} />
            </Card>
            <Card padding="lg">
              <SkeletonLines lines={4} />
            </Card>
            <Card padding="lg">
              <SkeletonLines lines={8} />
            </Card>
          </div>
        </div>
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

  const score = review?.score ?? provider.rating
  const totalRatings = review?.totalRatings ?? provider.reviews

  return (
    <div className="animate-fade-in mx-auto max-w-5xl space-y-5">
      <Link
        to="/bandingkan"
        className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 transition-colors hover:text-brand-600 dark:text-neutral-400 dark:hover:text-brand-400"
      >
        <span aria-hidden>←</span> Kembali ke hasil banding
      </Link>

      <GhostWarningBanner provider={provider} review={review} />

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <aside
          className={`space-y-5 self-start lg:sticky lg:top-24 ${SLIDE_UP}`}
          style={{ animationDelay: '60ms' }}
        >
          <Card padding="lg">
            <div className="flex flex-col items-center gap-2 text-center">
              <ProviderAvatar name={provider.name} emoji={provider.emoji} seed={provider.id} size="xl" />
              <div className="flex flex-wrap items-center justify-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight">{provider.name}</h1>
                <TierBadge tier={provider.tier} />
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{provider.tagline}</p>
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex flex-col items-center gap-2">
              <ScoreRing value={score} size={136} strokeWidth={11} />
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                dari {(totalRatings ?? 0).toLocaleString('id-ID')} ulasan mahasiswa
              </p>
            </div>
          </Card>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2 rounded-xl bg-neutral-100 px-3 py-2.5 dark:bg-neutral-800">
              <span className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                ⚡ Respon
              </span>
              <span className="text-sm font-extrabold tabular-nums">±{provider.responseTimeMinutes} mnt</span>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-neutral-100 px-3 py-2.5 dark:bg-neutral-800">
              <span className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                🕐 Jam operasional
              </span>
              <span className="text-right text-sm font-extrabold tabular-nums">{provider.openHours}</span>
            </div>
            <div
              className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 ${
                provider.noHiddenFees
                  ? 'bg-emerald-50 dark:bg-emerald-500/10'
                  : 'bg-amber-50 dark:bg-amber-500/10'
              }`}
            >
              <span className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                {provider.noHiddenFees ? '🛡️ Biaya' : '⚠️ Biaya'}
              </span>
              <span
                className={`text-sm font-extrabold tabular-nums ${
                  provider.noHiddenFees
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-amber-700 dark:text-amber-300'
                }`}
              >
                {provider.noHiddenFees ? 'Tanpa tersembunyi' : 'Bisa ada tambahan'}
              </span>
            </div>
          </div>

          <Card padding="lg">
            <h2 className="text-sm font-extrabold">Vibe tags</h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Paling sering disebut:</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {topPositiveTags.map((tag) => (
                <Tag key={tag.id} variant="success" icon={<span aria-hidden>✓</span>}>
                  {tag.label}
                </Tag>
              ))}
              {topWarningTags.map((tag) => (
                <Tag key={tag.id} variant="danger" icon={<span aria-hidden>!</span>}>
                  {tag.label}
                </Tag>
              ))}
              {topPositiveTags.length === 0 && topWarningTags.length === 0 && (
                <p className="text-xs italic text-neutral-400 dark:text-neutral-500">Belum ada tag.</p>
              )}
            </div>
          </Card>
        </aside>

        <div className="min-w-0 space-y-5">
          {review && (
            <Card padding="lg" className={SLIDE_UP}>
              <h2 className="text-sm font-extrabold">Rating per pilar</h2>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Tiga ukuran yang paling menentukan di kehidupan kampus — nilai dari ulasan mahasiswa.
              </p>
              <PillarBars pillars={review.pillars} className="mt-4" />
            </Card>
          )}

          <Card padding="lg" className={SLIDE_UP} style={{ animationDelay: '120ms' }}>
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

          <div className={SLIDE_UP} style={{ animationDelay: '180ms' }}>
            <ReviewForm provider={provider} />
          </div>

          <Card padding="lg" className={SLIDE_UP} style={{ animationDelay: '240ms' }}>
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <span aria-hidden>💬</span> Ulasan Mahasiswa
            </h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {individualReviews.length} ulasan dari mahasiswa yang pernah pakai {provider.name}.
            </p>

            {individualReviews.length > 0 && (
              <div className="mt-4">
                <RatingBreakdown reviews={individualReviews} />
              </div>
            )}

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

          <div className={SLIDE_UP} style={{ animationDelay: '300ms' }}>
            <ReportIssueCard provider={provider} review={review} />
          </div>
        </div>
      </div>
    </div>
  )
}
