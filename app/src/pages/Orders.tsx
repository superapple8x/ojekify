import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useOrders } from '../hooks/useOrders'
import type { OrderItem, OrderStatus } from '../api'
import { Button, Card, EmptyState, ProviderAvatar, SkeletonProviderRow, Tag } from '../components'
import { formatIDR, formatTimeAgo } from '../lib/format'
import { ORDER_STATUSES, ORDER_STATUS_IDS } from '../lib/orderStatus'
import { cn } from '../lib/cn'
import { OrderDetailSheet } from '../flows/orders/OrderDetailSheet'

type Filter = 'all' | OrderStatus

const FILTER_LABELS: Record<Filter, string> = {
  all: 'Semua',
  pending: ORDER_STATUSES.pending.label,
  proses: ORDER_STATUSES.proses.label,
  selesai: ORDER_STATUSES.selesai.label,
  dibatalkan: ORDER_STATUSES.dibatalkan.label,
}

export default function Orders() {
  const { orders } = useOrders()
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<OrderItem | null>(null)

  const sorted = useMemo(
    () => (orders ? [...orders].sort((a, b) => b.createdAt - a.createdAt) : null),
    [orders],
  )

  const counts = useMemo(() => {
    const tally = { all: orders?.length ?? 0 } as Record<Filter, number>
    for (const status of ORDER_STATUS_IDS) {
      tally[status] = orders?.filter((order) => order.status === status).length ?? 0
    }
    return tally
  }, [orders])

  const filtered = useMemo(
    () => (filter === 'all' ? sorted : sorted?.filter((order) => order.status === filter) ?? null),
    [sorted, filter],
  )

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <span aria-hidden>📋</span> Pesanan saya
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Riwayat order via WhatsApp — tersimpan lokal di perangkatmu. Status bisa kamu update
          sendiri (mock).
        </p>
      </header>

      {orders && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter status pesanan">
          {(Object.keys(FILTER_LABELS) as Filter[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={cn(
                'rounded-full border-2 px-3.5 py-1.5 text-xs font-bold transition-all duration-200',
                filter === key
                  ? 'border-brand-500 bg-brand-500 text-white shadow-md shadow-brand-500/25'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-brand-400 hover:text-brand-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-brand-400 dark:hover:text-brand-300',
              )}
            >
              {FILTER_LABELS[key]}
              <span className="ml-1.5 tabular-nums opacity-80">({counts[key]})</span>
            </button>
          ))}
        </div>
      )}

      {orders === null && (
        <div role="status" aria-label="Memuat riwayat pesanan">
          <SkeletonProviderRow count={4} />
        </div>
      )}

      {sorted && sorted.length === 0 && (
        <EmptyState
          icon="🧾"
          title="Belum ada pesanan"
          description="Order lewat WhatsApp akan muncul di sini setelah kamu bandingkan, kirim, atau cetak."
          action={
            <Link to="/bandingkan">
              <Button size="sm">💸 Bandingkan dulu</Button>
            </Link>
          }
        />
      )}

      {filtered && filtered.length === 0 && sorted && sorted.length > 0 && (
        <EmptyState
          icon="🔍"
          title={`Tidak ada pesanan “${FILTER_LABELS[filter]}”`}
          description="Coba pilih filter lain, atau timpa filter ini dengan semua pesanan."
        />
      )}

      {filtered && filtered.length > 0 && (
        <Card padding="none" className="overflow-hidden">
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {filtered.map((order) => {
              const meta = ORDER_STATUSES[order.status]
              return (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(order)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 sm:px-5 dark:hover:bg-neutral-800/50"
                  >
                    <ProviderAvatar
                      name={order.providerName}
                      emoji={order.providerEmoji}
                      seed={order.providerId}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold">
                        {order.serviceLabel} <span className="text-neutral-400">•</span>{' '}
                        <span aria-label={`dari ${order.pickupName}`}>{order.pickupName}</span>{' '}
                        <span aria-hidden>→</span>{' '}
                        <span aria-label={`ke ${order.dropoffName}`}>{order.dropoffName}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">
                        {order.providerName} • {formatTimeAgo(order.createdAt)}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-extrabold tabular-nums">
                        {formatIDR(order.total)}
                      </span>
                      <Tag variant={meta.variant} icon={<span aria-hidden>{meta.emoji}</span>} className="mt-1">
                        {meta.label}
                      </Tag>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <OrderDetailSheet order={selected} onClose={() => setSelected(null)} onOrderChanged={setSelected} />
    </div>
  )
}