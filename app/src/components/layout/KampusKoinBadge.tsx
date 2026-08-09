import { useKampusKoin } from '../../hooks/useKampusKoin'
import { cn } from '../../lib/cn'

export function KampusKoinBadge({ compact = false }: { compact?: boolean }) {
  const { state } = useKampusKoin()
  const balance = state?.balance

  return (
    <span
      title="KampusKoin — nilai ulasan jujur untuk +50 koin, tukar voucher nanti"
      aria-label={balance === undefined ? 'Saldo KampusKoin dimuat' : `Saldo KampusKoin: ${balance.toLocaleString('id-ID')}`}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-50 px-2.5 py-1.5 text-xs font-extrabold text-amber-700 tabular-nums transition-colors dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
        compact && 'px-2',
      )}
    >
      <span aria-hidden>🪙</span>
      {state === null ? (
        <span className="inline-block h-3 w-6 animate-pulse rounded bg-amber-300/40 dark:bg-amber-500/30" />
      ) : (
        (balance ?? 0).toLocaleString('id-ID')
      )}
    </span>
  )
}