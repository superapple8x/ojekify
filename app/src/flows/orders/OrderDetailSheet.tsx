import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type DisputeKind, type DisputeReport, type OrderItem } from '../../api'
import { Button, Modal, ProviderAvatar, SkeletonLines, Tag } from '../../components'
import { cn } from '../../lib/cn'
import { formatIDR, formatTimeAgo } from '../../lib/format'
import { ACTIVE_ORDER_STATUSES, ORDER_STATUSES } from '../../lib/orderStatus'
import { pushAppToast } from '../../hooks/useAppToasts'
import { pushOrdersChanged } from '../../hooks/useOrders'

const DISPUTE_KINDS: { kind: DisputeKind; label: string; emoji: string }[] = [
  { kind: 'ghosted', label: 'Admin Ghosted Me', emoji: '👻' },
  { kind: 'no-show', label: 'Driver Never Arrived', emoji: '🚫' },
]

export interface OrderDetailSheetProps {
  order: OrderItem | null
  onClose: () => void
  onOrderChanged: (updated: OrderItem) => void
}

export function OrderDetailSheet({ order, onClose, onOrderChanged }: OrderDetailSheetProps) {
  const [updating, setUpdating] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'selesai' | 'dibatalkan' | null>(null)
  const [disputes, setDisputes] = useState<DisputeReport[] | null>(null)
  const [reporting, setReporting] = useState<DisputeKind | null>(null)
  const [submittingReport, setSubmittingReport] = useState(false)

  const orderId = order?.id

  useEffect(() => {
    if (!orderId) return
    let alive = true
    setDisputes(null)
    void api.getDisputes().then((reports) => alive && setDisputes(reports))
    return () => {
      alive = false
    }
  }, [orderId])

  if (!order) return null
  const meta = ORDER_STATUSES[order.status]
  const active = ACTIVE_ORDER_STATUSES.includes(order.status)
  const orderDisputes = (disputes ?? []).filter((report) => report.providerId === order.providerId)

  const applyStatus = async (next: 'selesai' | 'dibatalkan') => {
    if (!order || updating) return
    setUpdating(true)
    try {
      const updated = await api.updateOrderStatus(order.id, next)
      if (updated) {
        onOrderChanged(updated)
        pushOrdersChanged()
        pushAppToast({
          icon: ORDER_STATUSES[updated.status].emoji,
          title: updated.status === 'selesai' ? 'Pesanan selesai 🎉' : 'Pesanan dibatalkan',
          body:
            updated.status === 'selesai'
              ? `Jangan lupa nilai ${updated.providerName} — +50 KampusKoin.`
              : `${updated.providerName} diberi tahu lewat WhatsApp.`,
        })
        setConfirmAction(null)
      }
    } finally {
      setUpdating(false)
    }
  }

  const handleReport = async () => {
    if (!order || !reporting || submittingReport) return
    setSubmittingReport(true)
    try {
      const report = await api.reportDispute({
        providerId: order.providerId,
        providerName: order.providerName,
        providerEmoji: order.providerEmoji,
        kind: reporting,
      })
      setDisputes((current) => [...(current ?? []), report])
      setReporting(null)
      pushAppToast({
        icon: '📮',
        title: 'Laporan terkirim',
        body: `Pesanan ${order.id} dicatat — skor ${order.providerName} diturunkan sementara.`,
      })
    } finally {
      setSubmittingReport(false)
    }
  }

  return (
    <>
      <Modal open={Boolean(order)} onClose={onClose} title={order ? `Pesanan ${order.id}` : undefined} size="md">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ProviderAvatar
              name={order.providerName}
              emoji={order.providerEmoji}
              seed={order.providerId}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold">{order.providerName}</p>
              <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                {order.serviceLabel} • {formatTimeAgo(order.createdAt)}
              </p>
            </div>
            <Tag variant={meta.variant} icon={<span aria-hidden>{meta.emoji}</span>}>
              {meta.label}
            </Tag>
          </div>

          <p className="rounded-xl bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            📍 {order.pickupName} <span aria-hidden>→</span> {order.dropoffName} •{' '}
            <span className="font-extrabold tabular-nums">{formatIDR(order.total)}</span>
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-brand-600 dark:text-brand-400">
            <Link
              to={`/provider/${order.providerId}`}
              className="transition-colors hover:text-brand-700 dark:hover:text-brand-300"
              onClick={onClose}
            >
              👤 Lihat profil &amp; ulasan
            </Link>
            <a
              href={order.waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-brand-700 dark:hover:text-brand-300"
            >
              💬 Buka obrolan WhatsApp ↗
            </a>
          </div>

          {active && (
            <div className="space-y-2.5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/40">
              <p className="text-xs font-extrabold text-neutral-700 dark:text-neutral-200">
                Update alur pesanan (mock)
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{meta.hint}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  loading={updating && confirmAction === 'selesai'}
                  disabled={updating}
                  onClick={() => setConfirmAction('selesai')}
                >
                  ✓ Tandai selesai
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  loading={updating && confirmAction === 'dibatalkan'}
                  disabled={updating}
                  onClick={() => setConfirmAction('dibatalkan')}
                >
                  ✕ Batalkan
                </Button>
              </div>
            </div>
          )}

          {order.status === 'selesai' && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
              <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                ⭐ Nilai {order.providerName} — +50 KampusKoin
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-emerald-900/70 dark:text-emerald-200/60">
                Ulasan jujur dibayar pakai KampusKoin. Buka profil provider dan tulis 3 pilar
                (kecepatan, keamanan barang, kejujuran harga).
              </p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-extrabold text-neutral-700 dark:text-neutral-200">
              ⛔ Ada masalah? Lapor per order ini
            </p>
            {disputes === null ? (
              <SkeletonLines lines={1} />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {DISPUTE_KINDS.map((entry) => {
                  const reported = orderDisputes.some((report) => report.kind === entry.kind)
                  return (
                    <button
                      key={entry.kind}
                      type="button"
                      disabled={reported}
                      onClick={() => setReporting(entry.kind)}
                      className={cn(
                        'rounded-xl border-2 px-3 py-2.5 text-left text-xs font-bold transition-all duration-200 active:scale-[0.97]',
                        entry.kind === 'ghosted'
                          ? 'border-amber-200 bg-white text-amber-700 hover:border-amber-400 dark:border-amber-500/30 dark:bg-transparent dark:text-amber-300 dark:hover:border-amber-400'
                          : 'border-red-200 bg-white text-red-700 hover:border-red-400 dark:border-red-500/30 dark:bg-transparent dark:text-red-300 dark:hover:border-red-400',
                        reported &&
                          'cursor-not-allowed opacity-50 hover:border-inherit active:scale-100',
                      )}
                    >
                      {entry.emoji} {reported ? 'Sudah dilaporkan ✓' : entry.label}
                    </button>
                  )
                })}
              </div>
            )}
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
              Skor keandalan {order.providerName} diturunkan sementara + saran provider pengganti
              di profilnya.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={confirmAction === 'selesai' ? 'Tandai selesai?' : 'Batalkan pesanan?'}
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" block onClick={() => setConfirmAction(null)} disabled={updating}>
              Batal
            </Button>
            <Button
              variant={confirmAction === 'dibatalkan' ? 'danger' : 'primary'}
              block
              loading={updating}
              onClick={() => confirmAction && applyStatus(confirmAction)}
            >
              {confirmAction === 'selesai' ? '✓ Selesai' : 'Batalkan'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {confirmAction === 'selesai' ? (
            <>
              Pesanan <span className="font-extrabold">{order.id}</span> dari {order.providerName}{' '}
              ditandai selesai — status tersimpan di riwayat lokal.
            </>
          ) : (
            <>
              Pesanan <span className="font-extrabold">{order.id}</span> dari {order.providerName}{' '}
              akan dibatalkan — mock, tidak memengaruhi WhatsApp asli.
            </>
          )}
        </p>
      </Modal>

      <Modal
        open={reporting !== null}
        onClose={() => setReporting(null)}
        title={
          reporting
            ? `Laporkan “${DISPUTE_KINDS.find((entry) => entry.kind === reporting)?.label}”`
            : undefined
        }
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" block onClick={() => setReporting(null)} disabled={submittingReport}>
              Batal
            </Button>
            <Button variant="danger" block loading={submittingReport} onClick={handleReport}>
              Kirim laporan
            </Button>
          </div>
        }
      >
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {order.providerEmoji} {order.providerName} — pesanan {order.id} akan dicatat sebagai
          laporan anonim; skor keandalannya diturunkan sementara.
        </p>
      </Modal>
    </>
  )
}