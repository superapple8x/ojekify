import { useEffect, useState } from 'react'
import { api, type DisputeReport, type Provider, type ProviderReview } from '../../api'

export const GHOST_WARNING_THRESHOLD = 3

interface GhostWarningBannerProps {
  provider: Provider
  review: ProviderReview | null
}

export function GhostWarningBanner({ provider, review }: GhostWarningBannerProps) {
  const [disputes, setDisputes] = useState<DisputeReport[] | null>(null)

  useEffect(() => {
    let alive = true
    api.getDisputes().then((reports) => {
      if (!alive) return
      setDisputes(reports ?? [])
    })
    return () => {
      alive = false
    }
  }, [])

  if (disputes === null) return null

  const liveGhostCount = disputes.filter(
    (report) => report.providerId === provider.id && report.kind === 'ghosted',
  ).length
  const totalGhostCount = (review?.ghostReportsWeek ?? 0) + liveGhostCount
  if (totalGhostCount < GHOST_WARNING_THRESHOLD) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="animate-fade-in rounded-2xl border-2 border-amber-300/70 bg-amber-50 px-4 py-3 dark:border-amber-500/40 dark:bg-amber-500/10"
    >
      <p className="flex items-center gap-2 text-sm font-extrabold text-amber-800 dark:text-amber-200">
        <span aria-hidden>⚠️</span> Biasanya butuh &gt;30 menit untuk balas sekarang
      </p>
      <p className="mt-1 text-xs text-amber-700/90 dark:text-amber-300/90">
        Ada {totalGhostCount} laporan “Admin Ghosted Me” minggu ini — skor keandalannya sementara
        diturunkan.
      </p>
    </div>
  )
}