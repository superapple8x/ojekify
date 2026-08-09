import { useEffect, useMemo, useRef, useState } from 'react'
import type { Zone } from '../../../api'
import {
  BINDINGS_BY_ID,
  PAPER_SIZES,
  PAPER_WEIGHTS,
  PRINT_PARTNER,
  api,
  estimatePrintJob,
} from '../../../api'
import type { PrintUpload } from '../types'
import { buildPrintWaMessage } from '../../../lib/printWaMessage'
import { buildWaLink, copyToClipboard } from '../../../lib/wa'
import { formatIDR } from '../../../lib/format'
import { pushAppToast } from '../../../hooks/useAppToasts'
import { Button } from '../../../components'

export interface SummaryStepProps {
  file: PrintUpload
  pageCount: number
  colorMode: 'bw' | 'color' | 'mixed'
  mixedBwEnd: number
  paper: 'a4' | 'f4' | 'a3'
  weight: '70' | '80'
  binding: 'none' | 'staples' | 'tape' | 'spiral'
  customerName: string
  deliverToZoneId: string
  onChange: (patch: Partial<{ customerName: string; deliverToZoneId: string }>) => void
}

export function SummaryStep({
  file,
  pageCount,
  colorMode,
  mixedBwEnd,
  paper,
  weight,
  binding,
  customerName,
  deliverToZoneId,
  onChange,
}: SummaryStepProps) {
  const [zones, setZones] = useState<Zone[]>([])
  const [fileLink, setFileLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [opening, setOpening] = useState(false)
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null)
  const copyTimer = useRef<number | null>(null)

  useEffect(() => {
    let alive = true
    void api.getZones().then((items) => alive && setZones(items))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true
    void api.getPrintFileLink({ name: file.name, sizeBytes: file.sizeBytes }).then((link) => {
      if (alive) setFileLink(link)
    })
    return () => {
      alive = false
    }
  }, [file])

  useEffect(() => {
    return () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
    }
  }, [])

  const deliverTo = zones.find((zone) => zone.id === deliverToZoneId)
  const estimate = useMemo(
    () => estimatePrintJob({ colorMode, mixedBwEnd, binding, pageCount }, deliverTo),
    [colorMode, mixedBwEnd, binding, pageCount, deliverTo],
  )

  const paperLabel = PAPER_SIZES.find((size) => size.id === paper)?.label ?? paper
  const weightLabel = PAPER_WEIGHTS.find((option) => option.id === weight)?.label ?? weight
  const finishingLabel = BINDINGS_BY_ID[binding].label
  const finishingEmoji = BINDINGS_BY_ID[binding].emoji

  const colorLabel =
    colorMode === 'bw'
      ? 'Semua halaman hitam putih'
      : colorMode === 'color'
        ? `Semua halaman (${estimate.colorPages} warna)`
        : `Pages 1-${estimate.bwPages} (Hitam Putih), Pages ${estimate.bwPages + 1}-${pageCount} (Warna)`

  const message = useMemo(() => {
    if (!customerName.trim() || !deliverTo || !fileLink) return ''
    return buildPrintWaMessage({
      customerName: customerName.trim(),
      deliverToName: deliverTo.name,
      fileName: file.name,
      pageCount,
      paperLabel,
      weightLabel,
      colorLabel,
      finishingLabel,
      fileLink,
      printCost: estimate.printCost + estimate.finishingCost,
      deliveryFee: estimate.deliveryFee.total,
      total: estimate.total,
    })
  }, [customerName, deliverTo, fileLink, file.name, pageCount, paperLabel, weightLabel, colorLabel, finishingLabel, estimate])

  const waLink = useMemo(
    () => (message ? buildWaLink(PRINT_PARTNER.phone, message) : ''),
    [message],
  )

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
    if (!deliverTo || !message || !waLink || opening) return
    setOpening(true)
    try {
      const order = await api.placeOrder({
        providerId: PRINT_PARTNER.id,
        providerName: PRINT_PARTNER.name,
        providerEmoji: PRINT_PARTNER.emoji,
        serviceLabel: 'Cetak & Antar',
        pickupName: 'Fotokopian Campus',
        dropoffName: deliverTo.name,
        total: estimate.total,
        waUrl: waLink,
      })
      setPlacedOrderId(order.id)
      pushAppToast({
        icon: '🖨️',
        title: 'Order Cetak & Antar tercatat',
        body: `Ada ambil dari fotokopian & antar ke ${deliverTo.name} — kamu akan diingatkan menilai 45 menit lagi (+50 KampusKoin).`,
      })
      window.open(waLink, '_blank', 'noopener,noreferrer')
    } finally {
      setOpening(false)
    }
  }

  const kampusZones = zones.filter((zone) => zone.area === 'kampus')
  const luarZones = zones.filter((zone) => zone.area === 'luar')

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border-2 border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-xs font-bold text-neutral-600 uppercase tracking-wide dark:text-neutral-300">
          🧾 Estimasi Biaya Split
        </p>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-neutral-600 dark:text-neutral-300">
              Cetak {estimate.bwPages} hal B&W × {formatIDR(500)} + {estimate.colorPages} hal warna ×{' '}
              {formatIDR(2000)}
            </span>
            <span className="font-bold tabular-nums">{formatIDR(estimate.printCost)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-neutral-600 dark:text-neutral-300">
              {finishingEmoji} {finishingLabel}
            </span>
            <span className="font-bold tabular-nums">{formatIDR(estimate.finishingCost)}</span>
          </div>
          <div className="border-t border-dashed border-neutral-200 dark:border-neutral-700" />
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-neutral-600 dark:text-neutral-300">Ongkir ke {deliverTo ? deliverTo.name : 'zona tujuan'}</span>
            <span className="font-bold tabular-nums">{formatIDR(estimate.deliveryFee.total)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              (base {formatIDR(estimate.deliveryFee.base)} + cas print {formatIDR(estimate.deliveryFee.casPrint)})
            </span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t-2 border-neutral-200 pt-3 dark:border-neutral-700">
          <span className="text-sm font-extrabold">Total yang dibayar (Tunai)</span>
          <span className="text-lg font-extrabold text-brand-600 tabular-nums dark:text-brand-400">
            {formatIDR(estimate.total)}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold">Antar ke mana? 📍</span>
          <div className="relative">
            <select
              value={deliverToZoneId}
              onChange={(event) => onChange({ deliverToZoneId: event.target.value })}
              className="h-12 w-full appearance-none rounded-xl border-2 border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-900 transition-colors focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
            >
              <option value="">Pilih zona tujuan…</option>
              {kampusZones.length > 0 && (
                <optgroup label="Dalam Kampus">
                  {kampusZones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.emoji} {zone.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {luarZones.length > 0 && (
                <optgroup label="Luar Kampus">
                  {luarZones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.emoji} {zone.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <span aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-neutral-400">
              ▾
            </span>
          </div>
        </label>
      </div>

      <div className="space-y-2">
        <label className="block space-y-1.5">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            Nama kamu <span aria-hidden>✍️</span>
          </span>
          <input
            type="text"
            value={customerName}
            onChange={(event) => onChange({ customerName: event.target.value })}
            placeholder="Contoh: Budi (Fakultas Ilmu Komputer)"
            className="h-12 w-full rounded-xl border-2 border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-900 transition-colors focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </label>
        {!customerName.trim() && (
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
            Dipakai di pesan WhatsApp biar admin fotokopian tahu ini pesanan siapa.
          </p>
        )}
      </div>

      {fileLink && deliverTo && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <span aria-hidden>🔗</span> Link aman untuk fotokopian (mock)
          </div>
          <p className="mt-2 select-all rounded-lg bg-white px-3 py-2 text-[13px] font-mono font-semibold text-emerald-800 break-all dark:bg-neutral-900 dark:text-emerald-300">
            {fileLink}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-emerald-900/70 dark:text-emerald-200/60">
            Tautan sekali pakai — real backend akan unggah file ke cloud dan auto-delete
            setelah 24 jam. Admin tinggal klik di komputer fotokopian, tanpa download di HP.
          </p>
        </div>
      )}

      {deliverTo && customerName.trim() && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <span aria-hidden>💬</span> Preview pesan untuk Fotokopi Mitra
          </div>
          <div className="mt-3 rounded-xl rounded-tl-sm whitespace-pre-wrap bg-white p-3.5 text-[13px] leading-relaxed text-neutral-800 shadow-sm dark:bg-neutral-900 dark:text-neutral-100">
            {message}
          </div>
          <p className="mt-2.5 text-[11px] leading-relaxed text-emerald-900/70 dark:text-emerald-200/60">
            Mengikuti format baku Cetak & Antar — lengkap dengan rincian biaya terpisah
            biar tidak ada biaya tersembunyi.
          </p>
        </div>
      )}

      <div className="space-y-2.5">
        <div className="flex gap-2">
          <Button
            variant="outline"
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
        >
          💬 Order via WhatsApp
        </Button>
        {!message && (
          <p className="text-center text-xs font-semibold text-neutral-400 dark:text-neutral-500">
            {!customerName.trim()
              ? 'Isi nama dulu ya — wajib untuk template ini.'
              : !deliverTo
                ? 'Pilih zona tujuan biar estimasi ongkir & pesan lengkap.'
                : 'Buat link aman dulu — tunggu sebentar…'}
          </p>
        )}
        {placedOrderId && (
          <p className="text-center text-xs font-semibold text-brand-600 dark:text-brand-400">
            ✓ Pesanan {placedOrderId} tercatat di riwayat pesananmu
          </p>
        )}
      </div>
    </div>
  )
}