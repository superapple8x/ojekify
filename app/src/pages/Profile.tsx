import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  api,
  type RedeemedVoucher,
  type VoucherCatalogItem,
  type Zone,
} from '../api'
import { Card, Tag, EmptyState } from '../components'
import { useKampusKoin, pushKoinChanged } from '../hooks/useKampusKoin'
import { useSavedPlaces } from '../hooks/useSavedPlaces'
import { pushAppToast } from '../hooks/useAppToasts'
import { copyToClipboard } from '../lib/wa'
import { formatTimeAgo } from '../lib/format'
import { cn } from '../lib/cn'

const KIND_META: Record<VoucherCatalogItem['kind'], { label: string; emoji: string; variant: 'brand' | 'info' }> = {
  print: { label: 'Print', emoji: '🖨️', variant: 'brand' },
  delivery: { label: 'Antar', emoji: '🛵', variant: 'info' },
}

export default function Profile() {
  const { state: koin } = useKampusKoin()
  const { places, removePlace } = useSavedPlaces()
  const [zones, setZones] = useState<Zone[]>([])
  const [catalog, setCatalog] = useState<VoucherCatalogItem[] | null>(null)
  const [redeemed, setRedeemed] = useState<RedeemedVoucher[] | null>(null)
  const [redeemingId, setRedeemingId] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void Promise.all([api.getZones(), api.getVoucherCatalog(), api.getRedeemedVouchers()]).then(
      ([zoneItems, voucherItems, myVouchers]) => {
        if (!alive) return
        setZones(zoneItems)
        setCatalog(voucherItems)
        setRedeemed(myVouchers)
      },
    )
    return () => {
      alive = false
    }
  }, [])

  const resolvePlace = (zoneId: string) => zones.find((zone) => zone.id === zoneId)

  const handleRedeem = async (item: VoucherCatalogItem) => {
    if (redeemingId || !koin || koin.balance < item.cost) return
    setRedeemingId(item.id)
    try {
      const result = await api.redeemVoucher(item.id)
      if (result.voucher) {
        setRedeemed((current) => [result.voucher, ...(current ?? [])])
        pushKoinChanged()
        pushAppToast({
          icon: '🎫',
          title: 'Voucher terbit!',
          body: `${item.emoji} ${item.title} — kode ${result.voucher.code}.`,
        })
      } else if (result.error === 'insufficient') {
        pushAppToast({
          icon: '🪙',
          title: 'KampusKoin belum cukup',
          body: `${item.title} butuh ${item.cost} koin — tulis ulasan jujur untuk +50 per ulasan.`,
        })
      }
    } finally {
      setRedeemingId(null)
    }
  }

  const handleCopyCode = async (code: string) => {
    const ok = await copyToClipboard(code)
    if (!ok) return
    setCopiedCode(code)
    window.setTimeout(() => setCopiedCode((current) => (current === code ? null : current)), 2000)
  }

  const balance = koin?.balance
  
  const isAffordable = (item: VoucherCatalogItem) =>
    balance !== undefined && balance >= item.cost

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-6">
      <header className="flex items-center gap-4">
        <span
          aria-hidden
          className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-2xl shadow-md shadow-brand-500/30"
        >
          🎓
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight">Profil kamu</h1>
          <p className="mt-0.5 truncate text-sm text-neutral-500 dark:text-neutral-400">
            Mahasiswa percontohan • Prodi Teknik • Mock (belum ada login)
          </p>
        </div>
      </header>

      <Card padding="lg" className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full bg-gradient-to-br from-amber-300/30 to-amber-500/10 blur-2xl dark:from-amber-400/20 dark:to-amber-500/5"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <span aria-hidden>🪙</span> Saldo KampusKoin
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              Ulasan jujur = <b className="text-amber-600 dark:text-amber-300">+50 koin</b> (dari
              review.txt §6). Tukar jadi voucher cetak dan antar gratis di bawah.
            </p>
          </div>
          <div className="text-right">
            {balance === undefined ? (
              <div
                className="ml-auto h-9 w-28 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800"
                role="status"
                aria-label="Memuat saldo KampusKoin"
              />
            ) : (
              <>
                <p className="text-3xl font-extrabold tracking-tight text-amber-600 tabular-nums dark:text-amber-300">
                  {balance.toLocaleString('id-ID')}
                </p>
                <p className="text-[11px] font-bold tracking-wider text-amber-600/70 uppercase dark:text-amber-300/70">
                  KampusKoin
                </p>
              </>
            )}
          </div>
        </div>
        {koin && koin.entries.length > 0 && (
          <ul className="relative mt-4 space-y-1.5 border-t border-dashed border-neutral-200 pt-4 dark:border-neutral-800">
            {koin.entries.slice(0, 4).map((entry) => (
              <li key={entry.id} className="flex items-center gap-2 text-xs">
                <span
                  aria-hidden
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-extrabold tabular-nums',
                    entry.kind === 'earn'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
                  )}
                >
                  {entry.kind === 'earn' ? '+' : '−'}
                  {entry.amount}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold text-neutral-600 dark:text-neutral-300">
                  {entry.note}
                </span>
                <span className="shrink-0 text-neutral-400 tabular-nums dark:text-neutral-500">
                  {formatTimeAgo(entry.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <section aria-labelledby="voucher-catalog-title">
        <h2 id="voucher-catalog-title" className="mb-3 flex items-center gap-2 text-lg font-extrabold">
          <span aria-hidden>🎟️</span> Tukar voucher
        </h2>
        {catalog === null ? (
          <div className="grid gap-4 sm:grid-cols-2" role="status" aria-label="Memuat katalog voucher">
            {[0, 1].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-card bg-neutral-200 dark:bg-neutral-800" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {catalog.map((item) => {
              const affordable = isAffordable(item)
              const busy = redeemingId === item.id
              return (
                <Card key={item.id} className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="text-2xl" aria-hidden>
                        {item.emoji}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold">{item.title}</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <Tag variant={KIND_META[item.kind].variant} icon={<span aria-hidden>{KIND_META[item.kind].emoji}</span>}>
                      {KIND_META[item.kind].label}
                    </Tag>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <p className="text-sm font-extrabold text-amber-600 tabular-nums dark:text-amber-300">
                      {item.cost.toLocaleString('id-ID')} <span className="font-bold">koin</span>
                    </p>
                    <button
                      type="button"
                      disabled={!affordable || busy}
                      onClick={() => handleRedeem(item)}
                      aria-busy={busy}
                      className={cn(
                        'inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-[0.97]',
                        affordable && !busy
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 hover:bg-amber-400'
                          : 'cursor-not-allowed bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
                      )}
                    >
                      {busy ? 'Menukar…' : affordable ? 'Tukar 🎫' : 'Koin belum cukup'}
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
        <p className="mt-3 text-[11px] text-neutral-400 dark:text-neutral-500">
          💡 Mock: voucher tersimpan lokal + kode ditunjukkan ke admin provider lewat WhatsApp.
        </p>
      </section>

      <section aria-labelledby="my-vouchers-title">
        <h2 id="my-vouchers-title" className="mb-3 flex items-center gap-2 text-lg font-extrabold">
          <span aria-hidden>🧾</span> Voucherku
        </h2>
        {redeemed === null ? (
          <div className="h-24 animate-pulse rounded-card bg-neutral-200 dark:bg-neutral-800" role="status" aria-label="Memuat voucher kamu" />
        ) : redeemed.length === 0 ? (
          <EmptyState
            icon="🎫"
            title="Belum ada voucher"
            description="Saldo KampusKoin-mu belum pernah ditukar — pilih voucher di atas."
          />
        ) : (
          <Card padding="none" className="overflow-hidden">
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {redeemed.map((voucher) => (
                <li key={voucher.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span className="text-xl" aria-hidden>
                    {voucher.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">
                      {voucher.title}
                      <span className="ml-1.5 font-mono text-[11px] font-bold tracking-wider text-brand-600 dark:text-brand-400">
                        {voucher.code}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                      {formatTimeAgo(voucher.redeemedAt)} • {voucher.cost.toLocaleString('id-ID')} koin
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(voucher.code)}
                    className="shrink-0 rounded-full border-2 border-neutral-200 px-3 py-1 text-[11px] font-bold transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-neutral-800 dark:hover:border-brand-500/50 dark:hover:text-brand-300"
                  >
                    {copiedCode === voucher.code ? 'Tersalin ✓' : '📋 Salin'}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section aria-labelledby="saved-places-title">
        <h2 id="saved-places-title" className="mb-3 flex items-center gap-2 text-lg font-extrabold">
          <span aria-hidden>📍</span> Tempat tersimpan
        </h2>
        {places.length === 0 ? (
          <EmptyState
            icon="🏷️"
            title="Belum ada tempat tersimpan"
            description="Saat membandingkan harga, pilih zona jemput lalu simpan lewat form “Simpan jemputan ini”."
            action={
              <Link to="/bandingkan" className="rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-400">
                💸 Pilih rute dulu
              </Link>
            }
          />
        ) : (
          <Card padding="none" className="overflow-hidden">
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {places.map((place) => {
                const zone = resolvePlace(place.zoneId)
                return (
                  <li key={place.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <span className="text-xl" aria-hidden>
                      {zone?.emoji ?? '📍'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold">{place.label}</p>
                      <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                        {zone ? `${zone.name} • ${zone.area === 'kampus' ? 'dalam kampus' : 'luar kampus'}` : 'Zona dihapus dari katalog'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePlace(place.id)}
                      aria-label={`Hapus ${place.label}`}
                      className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-red-100 hover:text-red-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-red-500/20 dark:hover:text-red-400"
                    >
                      ✕
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}
        <p className="mt-3 text-[11px] text-neutral-400 dark:text-neutral-500">
          Tempat baru bisa disimpan dari wizard /bandingkan → langkah rute. Tersimpan lokal (mock).
        </p>
      </section>
    </div>
  )
}