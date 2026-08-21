import type { ComparisonRow, Quote, SelectedPlace, ServiceMeta, Zone } from '../../api'
import { Button, Modal, ProviderAvatar, TierBadge } from '../../components'
import { formatIDR, formatKm } from '../../lib/format'

export interface ReceiptModalProps {
  row: ComparisonRow | null
  service?: ServiceMeta
  pickup?: Zone
  dropoff?: Zone
  pickupPlace?: SelectedPlace | null
  dropoffPlace?: SelectedPlace | null
  onClose: () => void
}

export function ReceiptModal({ row, service, pickup, dropoff, onClose }: ReceiptModalProps) {
  const provider = row?.provider
  const quote: Quote | undefined = row?.quote

  return (
    <Modal
      open={Boolean(row)}
      onClose={onClose}
      title={provider ? `Rincian biaya • ${provider.name}` : 'Rincian biaya'}
      size="md"
    >
      {provider && quote && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <ProviderAvatar name={provider.name} emoji={provider.emoji} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">
                {provider.emoji} {provider.name}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{provider.tagline}</p>
            </div>
            <TierBadge tier={provider.tier} className="ml-auto shrink-0" />
          </div>

          {service && pickup && dropoff && (
            <p className="rounded-xl bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              {service.emoji} {service.label} · {pickup.emoji} {pickup.name} → {dropoff.emoji}{' '}
              {dropoff.name} · {formatKm(quote.distanceKm)}
            </p>
          )}

          <dl className="divide-y divide-dashed divide-neutral-200 dark:divide-neutral-800">
            {quote.lines.map((line) => (
              <div
                key={`${line.kind}-${line.label}`}
                className="flex items-baseline justify-between gap-4 py-2.5 text-sm"
              >
                <dt>
                  <span
                    className={
                      line.kind === 'cas'
                        ? 'font-semibold text-neutral-500 dark:text-neutral-400'
                        : 'font-bold'
                    }
                  >
                    {line.kind === 'cas' && <span className="mr-1" aria-hidden>+</span>}
                    {line.label}
                  </span>
                  {line.detail && (
                    <span className="mt-0.5 block text-xs text-neutral-400 dark:text-neutral-500">
                      {line.detail}
                    </span>
                  )}
                </dt>
                <dd className="shrink-0 font-semibold tabular-nums">{formatIDR(line.amount)}</dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 pt-3 text-base">
              <dt className="font-extrabold">Total yang harus dibayar</dt>
              <dd className="shrink-0 text-xl font-extrabold text-brand-600 tabular-nums dark:text-brand-400">
                {formatIDR(quote.total)}
              </dd>
            </div>
          </dl>

          <p className="rounded-xl bg-brand-50 px-3 py-2.5 text-xs leading-relaxed text-brand-800 dark:bg-brand-500/10 dark:text-brand-200">
            Catatan: rincian persis ini yang akan dikirim ke admin saat order. Tidak ada biaya
            tambahan di luar yang tercantum — kecuali rutenya diubah.
          </p>
        </div>
      )}

      <footer className="mt-5">
        <Button variant="outline" block onClick={onClose}>
          Tutup rincian
        </Button>
      </footer>
    </Modal>
  )
}