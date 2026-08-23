import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  Clock,
  Compass,
  MessageCircle,
  MessagesSquare,
  PenLine,
  SearchX,
  ShieldCheck,
  Tags,
  Zap,
} from 'lucide-react'
import { api, type IndividualReview, type Provider, type ProviderReview } from '../api'
import { useCountUp } from '../hooks/useCountUp'
import { ReviewForm } from '../flows/review/ReviewForm'
import { ReviewFilters, applyReviewFilters, type ReviewFilterState } from '../flows/review/ReviewFilters'
import { ReviewCard } from '../flows/review/ReviewCard'
import { ReportIssueCard } from '../flows/review/ReportIssueCard'
import { GhostWarningBanner } from '../flows/review/GhostWarningBanner'
import { buildWaLink } from '../lib/wa'
import { buildWaMessage } from '../lib/waMessage'
import {
  Button,
  Card,
  EmptyState,
  Modal,
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

const STAT_TONES = {
  neutral: {
    tile: 'bg-neutral-100 dark:bg-neutral-800',
    icon: 'bg-white text-brand-600 shadow-sm dark:bg-neutral-900 dark:text-brand-400',
  },
  success: {
    tile: 'bg-emerald-50 dark:bg-emerald-500/10',
    icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  warning: {
    tile: 'bg-amber-50 dark:bg-amber-500/10',
    icon: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
} as const

type StatTone = keyof typeof STAT_TONES

interface StatTileProps {
  icon: ReactNode
  label: string
  value: string
  tone?: StatTone
  valueClass?: string
}

function StatTile({ icon, label, value, tone = 'neutral', valueClass }: StatTileProps) {
  const t = STAT_TONES[tone]
  return (
    <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${t.tile}`}>
      <span aria-hidden className={`grid size-9 shrink-0 place-items-center rounded-lg ${t.icon}`}>
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
          {label}
        </span>
        <span className={`truncate text-sm font-extrabold tabular-nums ${valueClass ?? ''}`}>{value}</span>
      </span>
    </div>
  )
}

export default function ProviderProfile() {
  const { id } = useParams<{ id: string }>()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [review, setReview] = useState<ProviderReview | null>(null)
  const [individualReviews, setIndividualReviews] = useState<IndividualReview[]>([])
  const [filters, setFilters] = useState<ReviewFilterState>(DEFAULT_FILTERS)
  const [reviewOpen, setReviewOpen] = useState(false)
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

  const score = review?.score ?? provider?.rating ?? 0
  const animatedScore = useCountUp(score)

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
            <Card padding="none" className="overflow-hidden">
              <Skeleton className="h-24 rounded-none" />
              <div className="-mt-10 flex flex-col items-center gap-3 px-6 pb-6 sm:px-7">
                <Skeleton variant="circle" className="size-20" />
                <Skeleton className="mt-1.5 h-4 w-36" />
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
          icon={<SearchX className="size-7" />}
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

  const totalRatings = review?.totalRatings ?? provider.reviews
  const waMessage = buildWaMessage({ provider })
  const waLink = provider.phone ? buildWaLink(provider.phone, waMessage) : ''

  return (
    <div className="animate-fade-in mx-auto max-w-5xl space-y-5">
      <Link
        to="/bandingkan"
        className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 transition-colors hover:text-brand-600 dark:text-neutral-400 dark:hover:text-brand-400"
      >
        <ChevronLeft className="size-3.5 shrink-0" aria-hidden /> Kembali ke hasil banding
      </Link>

      <GhostWarningBanner provider={provider} review={review} />

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <aside
          className={`space-y-5 self-start lg:sticky lg:top-24 ${SLIDE_UP}`}
          style={{ animationDelay: '60ms' }}
        >
          <Card padding="none" className="relative overflow-hidden">
            <div
              aria-hidden
              className="h-24 bg-gradient-to-b from-brand-50 to-white dark:from-brand-500/10 dark:to-neutral-900"
            />
            <div className="-mt-10 flex flex-col items-center gap-1 px-6 pb-6 text-center sm:px-7">
              <ProviderAvatar name={provider.name} emoji={provider.emoji} seed={provider.id} size="xl" />
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                <h1 className="text-xl font-extrabold tracking-tight">{provider.name}</h1>
                <TierBadge tier={provider.tier} />
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{provider.tagline}</p>
            </div>
          </Card>

          {provider.phone && (
            <Button
              block
              size="lg"
              onClick={() => window.open(waLink, '_blank', 'noopener,noreferrer')}
            >
              <MessageCircle className="size-4" aria-hidden /> Pesan via WhatsApp
            </Button>
          )}

          <Card padding="lg">
            <div className="flex flex-col items-center gap-2">
              <ScoreRing value={score} size={136} strokeWidth={11}>
                <span className="text-3xl font-extrabold tracking-tight tabular-nums">
                  {animatedScore.toFixed(1)}
                </span>
              </ScoreRing>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                dari {(totalRatings ?? 0).toLocaleString('id-ID')} ulasan mahasiswa
              </p>
            </div>
          </Card>

          <div className="grid gap-2">
            <StatTile
              icon={<Zap className="size-4" />}
              label="Respon"
              value={`±${provider.responseTimeMinutes} mnt`}
            />
            <StatTile
              icon={<Clock className="size-4" />}
              label="Jam operasional"
              value={provider.openHours}
            />
            {provider.noHiddenFees ? (
              <StatTile
                icon={<ShieldCheck className="size-4" />}
                label="Biaya"
                tone="success"
                value="Tanpa tersembunyi"
                valueClass="text-emerald-700 dark:text-emerald-300"
              />
            ) : (
              <StatTile
                icon={<AlertTriangle className="size-4" />}
                label="Biaya"
                tone="warning"
                value="Bisa ada tambahan"
                valueClass="text-amber-700 dark:text-amber-300"
              />
            )}
          </div>

          <Card padding="lg">
            <h2 className="text-sm font-extrabold">Vibe tags</h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Paling sering disebut:</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {topPositiveTags.map((tag) => (
                <Tag key={tag.id} variant="success" icon={<Check className="size-3" />}>
                  {tag.label}
                </Tag>
              ))}
              {topWarningTags.map((tag) => (
                <Tag key={tag.id} variant="danger" icon={<AlertTriangle className="size-3" />}>
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
              <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <Compass className="size-4" aria-hidden /> Rating per pilar
            </h2>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Tiga ukuran yang paling menentukan di kehidupan kampus — nilai dari ulasan mahasiswa.
              </p>
              <PillarBars pillars={review.pillars} className="mt-4" />
            </Card>
          )}

          <Card padding="lg" className={SLIDE_UP} style={{ animationDelay: '120ms' }}>
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <Tags className="size-4" aria-hidden /> Vibe tags
            </h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Label singkat dari sesama mahasiswa soal pengalaman pakai {provider.name}.
            </p>

            <div className="mt-4 space-y-4">
              <section aria-label="Tag positif">
                <h3 className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <span aria-hidden className="size-2 rounded-full bg-emerald-500 dark:bg-emerald-400" /> Positive Tags
                </h3>
                {review && review.positiveTags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {review.positiveTags.map((tag) => (
                      <Tag key={tag.id} variant="success" icon={<Check className="size-3" />}>
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
                  <span aria-hidden className="size-2 rounded-full bg-red-500 dark:bg-red-400" /> Warning Tags (Red Flags)
                </h3>
                {review && review.warningTags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {review.warningTags.map((tag) => (
                      <Tag key={tag.id} variant="danger" icon={<AlertTriangle className="size-3" />}>
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

          <Card padding="lg" className={SLIDE_UP} style={{ animationDelay: '180ms' }}>
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <PenLine className="size-4" aria-hidden /> Tulis ulasan kamu
            </h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Nilai tiga pilar utama dan bagikan vibe tag pengalamanmu dengan {provider.name}.
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setReviewOpen(true)}>
              <PenLine className="size-3.5" aria-hidden /> Tulis ulasan
            </Button>
          </Card>

          <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Tulis ulasan" size="lg">
            <ReviewForm provider={provider} onSubmitted={() => setReviewOpen(false)} />
          </Modal>

          <Card padding="lg" className={SLIDE_UP} style={{ animationDelay: '240ms' }}>
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <MessagesSquare className="size-4" aria-hidden /> Ulasan Mahasiswa
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
                  icon={<SearchX className="size-7" />}
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
