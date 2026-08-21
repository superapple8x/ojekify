import { useEffect, useMemo, useRef, useState } from 'react'
import { api, type ComparisonRow, type ServiceMeta, type Zone } from '../../api'
import { Button, Modal, ProviderAvatar, StarRating, TierBadge } from '../../components'
import { formatKm } from '../../lib/format'
import { buildWaMessage } from '../../lib/waMessage'
import { buildWaLink, copyToClipboard } from '../../lib/wa'
import { pushAppToast } from '../../hooks/useAppToasts'
import { pushOrdersChanged } from '../../hooks/useOrders'

export interface ProviderSheetProps {
  row: ComparisonRow | null
  service?: ServiceMeta
  pickup?: Zone
  dropoff?: Zone
  paymentLabel: string
  errandLabel?: string
  itemCount?: number
  onClose: () => void
  onShowReceipt: () => void
}

export function ProviderSheet({
  row,
  service,
  pickup,
  dropoff,
  paymentLabel,
  errandLabel,
  itemCount,
  onClose,
  onShowReceipt,
}: ProviderSheetProps) {
  const provider = row?.provider
  const quote = row?.quote
  const [name, setName] = useState('')
  const [copied, setCopied] = useState(false)
  const [opening, setOpening] = useState(false)
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null)
  const copyTimer = useRef<number | null>(null)

  useEffect(() => {
    setName('')
    setCopied(false)
    setOpening(false)
    setPlacedOrderId(null)
  }, [provider?.id])

  const message = useMemo(() => {
    if (!provider || !quote || !service || !pickup || !dropoff) return ''
    if (provider.waTemplate.needsName && !name.trim()) return ''
    return buildWaMessage({
      provider,
      quote,
      serviceLabel:
        errandLabel && service.id === 'jasa' ? `${service.label} (${errandLabel})` : service.label,
      pickupName: pickup.name,
      dropoffName: dropoff.name,
      paymentLabel,
      customerName: name,
      itemCount,
    })
  }, [provider, quote, service, pickup, dropoff, errandLabel, paymentLabel, itemCount, name])

  const waLink = useMemo(() => {
    if (!provider || !message) return ''
    return buildWaLink(provider.phone, message)
  }, [provider, message])

  useEffect(() => {
    return () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
    }
  }, [])

  const handleCopy = async () => {
    if (!message || copied) return
    const ok = await copyToClipboard(message)
    if (ok) {
      setCopied(true)
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleOrder = async () => {
    if (
      !provider ||
      !quote ||
      !service ||
      !pickup ||
      !dropoff ||
      !message ||
      !waLink ||
      opening
    ) {
      return
    }
    setOpening(true)
    try {
      const order = await api.placeOrder({
        providerId: provider.id,
        providerName: provider.name,
        providerEmoji: provider.emoji,
        serviceLabel:
          errandLabel && service.id === 'jasa' ? `${service.label} (${errandLabel})` : service.label,
        pickupName: pickup.name,
        dropoffName: dropoff.name,
        total: quote.total,
        waUrl: waLink,
      })
      setPlacedOrderId(order.id)
      pushAppToast({
        icon: '📦',
        title: 'Order tercatat di riwayat',
        body: `${service.emoji} ${service.label} • ${pickup.emoji} ${pickup.name} → ${dropoff.emoji} ${dropoff.name} via ${provider.name} — kamu akan diingatkan menilai 45 menit lagi.`,
      })
      pushOrdersChanged()
      window.open(waLink, '_blank', 'noopener,noreferrer')
    } finally {
      setOpening(false)
    }
  }

  return (
    <Modal
      open={Boolean(row)}
      onClose={onClose}
      title={provider ? `Pesan WhatsApp • ${provider.name}` : 'Pesan WhatsApp'}
      size="md"
      footer={
        <div className="space-y-2.5">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onShowReceipt}>
              Rincian biaya
            </Button>
            <Button
              variant={copied ? 'secondary' : 'outline'}
              className="flex-1"
              onClick={handleCopy}
              disabled={!message}
            >
              {copied ? 'Tersalin ✓' : '📋 Salin pesan'}
            </Button>
          </div>
          <Button
            block
            size="lg"
            loading={opening}
            disabled={!message}
            onClick={handleOrder}
            aria-describedby={!message ? 'wa-order-hint' : undefined}
          >
            💬 Order via WhatsApp
          </Button>
          {!message && (
            <p
              id="wa-order-hint"
              className="text-center text-xs font-semibold text-neutral-400 animate-fade-in dark:text-neutral-500"
              aria-live="polite"
            >
              {provider &&
              provider.waTemplate.needsName &&
              !name.trim() &&
              Boolean(service && pickup && dropoff && quote)
                ? 'Lengkapi format dulu — nama kamu wajib untuk template ini.'
                : 'Belum semua field valid — lengkapi permintaan dulu biar bisa order.'}
            </p>
          )}
          {placedOrderId && (
            <p className="flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-brand-600 animate-fade-in dark:text-brand-400">
              ✓ Pesanan {placedOrderId} sudah tercatat di riwayat pesananmu
            </p>
          )}
        </div>
      }
    >
      {provider && quote && service && pickup && dropoff && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ProviderAvatar name={provider.name} emoji={provider.emoji} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-sm font-extrabold">{provider.name}</p>
                <TierBadge tier={provider.tier} />
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                <StarRating value={provider.rating} size="sm" />
                <span className="font-semibold tabular-nums">{provider.rating.toFixed(1)}</span>
                <span>· ±{provider.responseTimeMinutes} mnt</span>
              </div>
            </div>
          </div>

          <p className="rounded-xl bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            {service.emoji} {service.label}
            {errandLabel && service.id === 'jasa' ? ` (${errandLabel})` : ''} · {pickup.emoji}{' '}
            {pickup.name} → {dropoff.emoji} {dropoff.name} · {formatKm(quote.distanceKm)} ·{' '}
            {paymentLabel}
            {itemCount ? ` · ${itemCount} item` : ''}
          </p>

          {provider.waTemplate.needsName && (
            <label className="block space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                Nama kamu <span aria-hidden>✍️</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  wajib • format {provider.waTemplate.id}
                </span>
              </span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Derry"
                className="h-12 w-full rounded-xl border-2 border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-900 transition-colors focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
              />
              {!name && (
                <span className="block text-[11px] text-neutral-400 dark:text-neutral-500">
                  Belum lengkap — pesan di bawah akan menyertakan nama begitu kamu ketik.
                </span>
              )}
            </label>
          )}

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <span aria-hidden>💬</span> Preview pesan untuk {provider.name}
              <span className="ml-auto rounded-full bg-emerald-600/10 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-emerald-700 uppercase dark:bg-emerald-500/15 dark:text-emerald-300">
                {provider.waTemplate.id}
              </span>
            </div>
            <div className="mt-3 rounded-xl rounded-tl-sm whitespace-pre-wrap bg-white p-3.5 text-[13px] leading-relaxed text-neutral-800 shadow-sm dark:bg-neutral-900 dark:text-neutral-100">
              {message || (
                <span className="text-neutral-400 italic dark:text-neutral-500">
                  Pesan baku {provider.name} akan muncul di sini begitu format lengkap…
                </span>
              )}
            </div>
            <p className="mt-2.5 text-[11px] leading-relaxed text-emerald-900/70 dark:text-emerald-200/60">
              Pesan mengikuti format baku {provider.name} — lengkap dengan ringkasan harga dari
              komparator, biar tidak ada biaya tersembunyi.
            </p>
          </div>
        </div>
      )}
    </Modal>
  )
}