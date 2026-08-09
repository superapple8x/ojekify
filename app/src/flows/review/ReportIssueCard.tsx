import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  api,
  type DisputeKind,
  type DisputeReport,
  type Provider,
  type ProviderReview,
} from '../../api'
import {
  Button,
  Card,
  Modal,
  ProviderAvatar,
  SkeletonLines,
  StarRating,
  TierBadge,
} from '../../components'
import { cn } from '../../lib/cn'
import { pushAppToast } from '../../hooks/useAppToasts'

const DISPUTE_KINDS: { kind: DisputeKind; label: string; emoji: string; hint: string }[] = [
  {
    kind: 'ghosted',
    label: 'Admin Ghosted Me',
    emoji: '👻',
    hint: 'Pesan dibaca, admin tidak pernah balas',
  },
  {
    kind: 'no-show',
    label: 'Driver Never Arrived',
    emoji: '🚫',
    hint: 'Order diterima tapi driver tidak datang',
  },
]

const SCORE_PENALTY = 0.2
const MIN_SCORE = 0.5

const KIND_LABEL: Record<DisputeKind, string> = {
  ghosted: 'Admin Ghosted Me',
  'no-show': 'Driver Never Arrived',
}

interface ReportIssueCardProps {
  provider: Provider
  review: ProviderReview | null
}

export function ReportIssueCard({ provider, review }: ReportIssueCardProps) {
  const navigate = useNavigate()
  const [disputes, setDisputes] = useState<DisputeReport[] | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [reviews, setReviews] = useState<ProviderReview[]>([])
  const [confirming, setConfirming] = useState<DisputeKind | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submittedKind, setSubmittedKind] = useState<DisputeKind | null>(null)

  useEffect(() => {
    let alive = true
    Promise.all([api.getDisputes(), api.getProviders(), api.getReviews()]).then(
      ([reports, providerList, reviewList]) => {
        if (!alive) return
        setDisputes(reports)
        setProviders(providerList)
        setReviews(reviewList)
      },
    )
    return () => {
      alive = false
    }
  }, [])

  const providerDisputes = useMemo(
    () => (disputes ?? []).filter((report) => report.providerId === provider.id),
    [disputes, provider.id],
  )

  const reportCount = providerDisputes.length
  const baseScore = review?.score ?? provider.rating
  const dockedScore = Math.max(MIN_SCORE, baseScore - reportCount * SCORE_PENALTY)

  const suggestion = useMemo(() => {
    if (!providers.length || !reviews.length) return null
    const candidates = reviews
      .filter((candidate) => candidate.providerId !== provider.id)
      .map((candidate) => ({
        provider: providers.find((entry) => entry.id === candidate.providerId),
        score: candidate.score,
        ghostReports: candidate.ghostReportsWeek,
      }))
      .filter((entry) => entry.provider !== undefined)
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.ghostReports - b.ghostReports ||
          a.provider!.name.localeCompare(b.provider!.name),
      )
    return candidates[0]?.provider ?? null
  }, [providers, reviews, provider.id])

  const handleSubmit = async () => {
    if (!confirming) return
    setSubmitting(true)
    try {
      const report = await api.reportDispute({
        providerId: provider.id,
        providerName: provider.name,
        providerEmoji: provider.emoji,
        kind: confirming,
      })
      setDisputes((current) => [...(current ?? []), report])
      setSubmittedKind(confirming)
      setConfirming(null)
      pushAppToast({
        icon: '📮',
        title: 'Laporan terkirim',
        body: `Skor keandalan ${provider.name} diturunkan sementara — cek saran provider pengganti.`,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card padding="lg">
      <h2 className="flex items-center gap-2 text-sm font-extrabold">
        <span aria-hidden>⛔</span> Ada masalah sama {provider.name}?
      </h2>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        Order via WhatsApp diabaikan atau tidak pernah sampai? Lapor di sini — skor keandalan
        diturunkan sementara dan kami sarankan provider pengganti.
      </p>

      {disputes === null ? (
        <div className="mt-4">
          <SkeletonLines lines={2} />
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <div className="grid gap-2 sm:grid-cols-2" aria-label="Pilih jenis masalah">
            {DISPUTE_KINDS.map((entry) => {
              const reported = providerDisputes.some((report) => report.kind === entry.kind)
              return (
                <button
                  key={entry.kind}
                  type="button"
                  disabled={reported}
                  onClick={() => setConfirming(entry.kind)}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition-all duration-200 active:scale-[0.97]',
                    entry.kind === 'ghosted'
                      ? 'border-amber-200 bg-white text-amber-700 hover:border-amber-400 dark:border-amber-500/30 dark:bg-transparent dark:text-amber-300 dark:hover:border-amber-400'
                      : 'border-red-200 bg-white text-red-700 hover:border-red-400 dark:border-red-500/30 dark:bg-transparent dark:text-red-300 dark:hover:border-red-400',
                    reported &&
                      'cursor-not-allowed opacity-50 hover:border-inherit active:scale-100 dark:hover:border-red-500/30',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden>{entry.emoji}</span>
                    {reported ? 'Sudah dilaporkan ✓' : entry.label}
                  </span>
                  <span className="text-[10px] font-medium opacity-80">{entry.hint}</span>
                </button>
              )
            })}
          </div>

          <p className="pt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
            ⛔ Skor keandalan saat ini:{' '}
            <span className="font-extrabold tabular-nums text-red-600 dark:text-red-400">
              {dockedScore.toFixed(1)}
            </span>
            {reportCount > 0 ? (
              <>
                {' '}
                <span aria-hidden>↓</span> dari {baseScore.toFixed(1)} · {reportCount} laporan
              </>
            ) : (
              <> (belum ada laporan)</>
            )}
            <span className="ml-1 font-normal">
              — {SCORE_PENALTY.toFixed(1)} turun per laporan, {MIN_SCORE.toFixed(1)} batas bawah.
            </span>
          </p>
        </div>
      )}

      {submittedKind && (
        <div aria-live="polite" className="mt-4 space-y-4">
          <div className="rounded-xl bg-red-50 px-4 py-3 dark:bg-red-500/10">
            <p className="text-xs font-bold text-red-700 dark:text-red-300">
              📮 Laporan “{KIND_LABEL[submittedKind]}” terkirim
            </p>
            <p className="mt-1 text-[11px] text-neutral-600 dark:text-neutral-400">
              Skor keandalan {provider.name} sementara dari {baseScore.toFixed(1)} →{' '}
              <span className="font-extrabold tabular-nums">{dockedScore.toFixed(1)}</span> —{' '}
              {reportCount} laporan tercatat pekan ini.
            </p>
          </div>

          {suggestion && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-800/40">
              <p className="text-xs font-extrabold text-neutral-700 dark:text-neutral-200">
                🔁 Lanjut pakai siapa? — Saran terbaik
              </p>
              <div className="mt-3 flex items-center gap-3">
                <ProviderAvatar
                  name={suggestion.name}
                  emoji={suggestion.emoji}
                  seed={suggestion.id}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-extrabold">{suggestion.name}</p>
                    <TierBadge tier={suggestion.tier} />
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                    <StarRating value={suggestion.rating} size="sm" />
                    <span className="font-semibold tabular-nums">
                      {suggestion.rating.toFixed(1)}
                    </span>
                    <span>· ±{suggestion.responseTimeMinutes} mnt</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/provider/${suggestion.id}`)}
                >
                  👤 Lihat profil
                </Button>
                <Link to="/bandingkan">
                  <Button variant="primary" size="sm">
                    ⚖️ Bandingkan harga
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title={confirming ? `Laporkan “${KIND_LABEL[confirming]}”` : undefined}
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" block onClick={() => setConfirming(null)} disabled={submitting}>
              Batal
            </Button>
            <Button variant="danger" block loading={submitting} onClick={handleSubmit}>
              {submitting ? 'Mengirim…' : 'Kirim laporan'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {provider.emoji} {provider.name} {confirming ? `— ${KIND_LABEL[confirming]}` : ''}
        </p>
        <ul className="mt-3 space-y-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          <li>
            ⛔ Skor keandalan diturunkan {SCORE_PENALTY.toFixed(1)} sementara (batas{' '}
            {MIN_SCORE.toFixed(1)}).
          </li>
          <li>🔁 Setelah laporan, kamu langsung dapat saran provider pengganti.</li>
          <li>📮 Laporan tercatat anonim — satu laporan per jenis masalah.</li>
        </ul>
      </Modal>
    </Card>
  )
}