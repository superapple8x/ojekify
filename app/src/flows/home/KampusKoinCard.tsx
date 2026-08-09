import { Link } from 'react-router-dom'
import { Card } from '../../components'
import { useKampusKoin } from '../../hooks/useKampusKoin'

export function KampusKoinCard() {
  const { state } = useKampusKoin()

  return (
    <Card padding="lg" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full bg-gradient-to-br from-amber-300/30 to-amber-500/10 blur-2xl dark:from-amber-400/20 dark:to-amber-500/5"
      />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-extrabold">
            <span aria-hidden>🪙</span> KampusKoin kamu
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            Nilai ulasan jujur setelah order — tiap ulasan = <b className="text-amber-600 dark:text-amber-300">+50 KampusKoin</b>.
            Nanti bisa ditukar voucher cetak atau antar gratis.
          </p>
          <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
            💡 45 menit setelah order, kamu diingatkan buat nulis ulasan.
          </p>
        </div>
        <div className="text-right">
          {state === null ? (
            <div className="space-y-2" role="status" aria-label="Memuat saldo KampusKoin">
              <div className="ml-auto h-8 w-24 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
              <div className="ml-auto h-3 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            </div>
          ) : (
            <>
              <p className="text-3xl font-extrabold tracking-tight text-amber-600 tabular-nums dark:text-amber-300">
                {state.balance.toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] font-bold tracking-wider text-amber-600/70 uppercase dark:text-amber-300/70">
                KampusKoin
              </p>
            </>
          )}
        </div>
      </div>
      <div className="relative mt-4">
        <Link
          to="/bandingkan"
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          💸 Bandingkan &amp; order dulu →
        </Link>
      </div>
    </Card>
  )
}