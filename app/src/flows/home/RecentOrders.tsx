import { Link } from 'react-router-dom'
import { useOrders } from '../../hooks/useOrders'
import { Button, Card, EmptyState, ProviderAvatar, SkeletonProviderRow, Tag } from '../../components'
import { formatIDR, formatTimeAgo } from '../../lib/format'

export function RecentOrders() {
  const { orders } = useOrders()

  const recent = orders ? [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3) : null

  return (
    <Card padding="none" className="overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-extrabold">
            <span aria-hidden>🧾</span> Pesanan terakhir
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Riwayat order via WhatsApp — tersimpan lokal di perangkatmu.
          </p>
        </div>
        <Link
          to="/pesanan"
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          Lihat semua →
        </Link>
      </header>

      {orders === null && (
        <div role="status" aria-label="Memuat pesanan terakhir">
          <SkeletonProviderRow count={2} />
        </div>
      )}

      {recent && recent.length === 0 && (
        <div className="p-4 sm:p-5">
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
        </div>
      )}

      {recent && recent.length > 0 && (
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {recent.map((order) => (
            <li
              key={order.id}
              className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            >
              <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
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
                  <Tag variant="neutral" className="mt-1">
                    Menunggu
                  </Tag>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}