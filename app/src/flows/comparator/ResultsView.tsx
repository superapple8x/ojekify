import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  api,
  ERRAND_KINDS,
  type ComparisonRow,
  type QuoteRequest,
  type ServiceMeta,
  type Zone,
} from '../../api'
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ProviderAvatar,
  SkeletonProviderRow,
  StarRating,
  Tag,
  TierBadge,
  type TagVariant,
} from '../../components'
import { formatIDR } from '../../lib/format'
import { conditionsFromDraft, type ComparatorDraft } from './types'
import { ReceiptModal } from './ReceiptModal'
import { ProviderSheet } from './ProviderSheet'

export type ResultsSort = 'price' | 'rating'

const TAG_META: Record<string, { label: string; variant: TagVariant; icon: string }> = {
  cheapest: { label: 'Paling Murah!', variant: 'success', icon: '🏆' },
  fastest: { label: 'Respon Tercepat', variant: 'info', icon: '⚡' },
  noHiddenFees: { label: 'Tanpa Biaya Tersembunyi', variant: 'neutral', icon: '🛡️' },
}

interface ResultsViewProps {
  draft: ComparatorDraft
  hour: number
  onEditRequest: () => void
}

export function ResultsView({ draft, hour, onEditRequest }: ResultsViewProps) {
  const navigate = useNavigate()
  const [services, setServices] = useState<ServiceMeta[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [rows, setRows] = useState<ComparisonRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<ResultsSort>('price')
  const [noHiddenOnly, setNoHiddenOnly] = useState(false)
  const [receiptRow, setReceiptRow] = useState<ComparisonRow | null>(null)
  const [waRow, setWaRow] = useState<ComparisonRow | null>(null)

  const request: QuoteRequest | null = useMemo(() => {
    if (!draft.service || !draft.pickup || !draft.dropoff) return null
    return {
      service: draft.service,
      pickupZoneId: draft.pickup.zoneId,
      dropoffZoneId: draft.dropoff.zoneId,
      conditions: conditionsFromDraft(draft, hour),
      extras: draft.extras,
    }
  }, [draft, hour])

  useEffect(() => {
    if (!request) return
    let alive = true
    setLoading(true)
    setRows(null)
    Promise.all([api.getServices(), api.getZones(), api.compareQuote(request)]).then(
      ([items, zoneList, result]) => {
        if (!alive) return
        setServices(items)
        setZones(zoneList)
        setRows(result.rows)
        setLoading(false)
      },
    )
    return () => {
      alive = false
    }
  }, [request])

  const visibleRows = useMemo(() => {
    if (!rows) return []
    let result = rows
    if (noHiddenOnly) {
      result = result.filter((row) => row.provider.noHiddenFees)
    }
    if (sort === 'rating') {
      result = [...result].sort(
        (a, b) =>
          b.provider.rating - a.provider.rating ||
          a.quote.total - b.quote.total ||
          a.provider.name.localeCompare(b.provider.name),
      )
    }
    return result
  }, [rows, sort, noHiddenOnly])

  const service = services.find((entry) => entry.id === draft.service)
  const pickup = zones.find((zone) => zone.id === draft.pickup?.zoneId)
  const dropoff = zones.find((zone) => zone.id === draft.dropoff?.zoneId)
  const errandKind = ERRAND_KINDS.find((kind) => kind.id === draft.extras.errandKind)
  const paymentLabel = draft.cashless ? 'Non-tunai' : 'Tunai'
  const itemCount = draft.extras.itemCount ?? 0

  const showRank = sort === 'price' && !noHiddenOnly

  const conditionChips: string[] = []
  if (draft.raining) conditionChips.push('🌧️ Hujan')
  if (draft.cashless) conditionChips.push('💳 Non-tunai')
  if (draft.forceNight) conditionChips.push('🌙 Malam (23.00)')
  else if (hour >= 22) conditionChips.push(`🌙 Malam (${hour}.00)`)

  return (
    <div className="space-y-5">
      <Card padding="sm" className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
          {service && (
            <span className="font-bold">
              {service.emoji} {service.label}
            </span>
          )}
          {draft.pickup && draft.dropoff && (
            <span className="text-neutral-500 dark:text-neutral-400">
              {draft.pickup.label} → {draft.dropoff.label}
            </span>
          )}
          {errandKind && (
            <span className="text-neutral-500 dark:text-neutral-400">
              · {errandKind.emoji} {errandKind.label}
            </span>
          )}
          {conditionChips.map((chip) => (
            <span key={chip} className="text-neutral-500 dark:text-neutral-400">
              · {chip}
            </span>
          ))}
        </div>
        <span className="shrink-0 text-xs font-semibold text-brand-600 tabular-nums dark:text-brand-400">
          {loading ? '…' : `${visibleRows.length} provider`}
        </span>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Chip selected={sort === 'price'} onClick={() => setSort('price')}>
          💸 Harga terendah
        </Chip>
        <Chip selected={sort === 'rating'} onClick={() => setSort('rating')}>
          ⭐ Rating tertinggi
        </Chip>
        <Chip selected={noHiddenOnly} onClick={() => setNoHiddenOnly((value) => !value)}>
          🛡️ Tanpa biaya tersembunyi
        </Chip>
      </div>

      {loading || !rows ? (
        <SkeletonProviderRow count={6} />
      ) : visibleRows.length === 0 ? (
        <EmptyState
          icon="🛡️"
          title="Tidak ada provider cocok"
          description="Semua provider yang sesuai filter sudah disaring. Coba matikan filter No Hidden Fees."
          action={
            <Button variant="outline" size="sm" onClick={() => setNoHiddenOnly(false)}>
              Tampilkan semua
            </Button>
          }
        />
      ) : (
        <ol className="space-y-3" aria-label="Daftar provider hasil komparasi">
          {visibleRows.map((row) => {
            const tagMeta = row.tag ? TAG_META[row.tag] : undefined
            return (
              <li key={row.provider.id}>
                <Card
                  interactive
                  padding="sm"
                  onClick={() => setReceiptRow(row)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setReceiptRow(row)
                    }
                  }}
                  className="w-full text-left"
                  aria-label={`Lihat rincian biaya ${row.provider.name}`}
                >
                  <div className="flex items-center gap-3.5">
                    {showRank && (
                      <span
                        className="grid size-6 shrink-0 place-items-center rounded-full bg-neutral-200 text-[11px] font-extrabold tabular-nums dark:bg-neutral-800"
                        aria-label={`Peringkat ${row.rank}`}
                      >
                        {row.rank}
                      </span>
                    )}
                    <ProviderAvatar
                      name={row.provider.name}
                      emoji={row.provider.emoji}
                      size="md"
                      seed={row.provider.id}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-sm font-extrabold">{row.provider.name}</h3>
                        <TierBadge tier={row.provider.tier} />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                        <StarRating value={row.provider.rating} size="sm" />
                        <span className="font-semibold tabular-nums">
                          {row.provider.rating.toFixed(1)}
                        </span>
                        <span>· {row.provider.reviews.toLocaleString('id-ID')} ulasan</span>
                        <span>· ±{row.provider.responseTimeMinutes} mnt</span>
                      </div>
                      {tagMeta && (
                        <Tag variant={tagMeta.variant} icon={<span aria-hidden>{tagMeta.icon}</span>}>
                          {tagMeta.label}
                        </Tag>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-extrabold tracking-tight tabular-nums">
                        {formatIDR(row.quote.total)}
                      </p>
                      <div className="mt-1.5 flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            navigate(`/provider/${row.provider.id}`)
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.stopPropagation()
                              event.preventDefault()
                              navigate(`/provider/${row.provider.id}`)
                            }
                          }}
                          aria-label={`Lihat profil ${row.provider.name}`}
                          className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-bold text-neutral-600 transition-all duration-150 hover:border-brand-400 hover:text-brand-700 active:scale-[0.97] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-brand-500/60 dark:hover:text-brand-300"
                        >
                          👤 Profil
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            setWaRow(row)
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.stopPropagation()
                              event.preventDefault()
                              setWaRow(row)
                            }
                          }}
                          aria-label={`Preview pesan WhatsApp untuk ${row.provider.name}`}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-md shadow-emerald-500/25 transition-all duration-150 hover:bg-emerald-400 active:scale-[0.97] dark:hover:bg-emerald-400"
                        >
                          💬 Pesan via WA
                        </button>
                      </div>
                      <p className="mt-1.5 text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                        Lihat rincian →
                      </p>
                    </div>
                  </div>
                </Card>
              </li>
            )
          })}
        </ol>
      )}

      <div className="flex justify-center">
        <Button variant="outline" onClick={onEditRequest}>
          Ubah permintaan
        </Button>
      </div>

      <ReceiptModal
        row={receiptRow}
        service={service}
        pickup={pickup}
        dropoff={dropoff}
        pickupPlace={draft.pickup}
        dropoffPlace={draft.dropoff}
        onClose={() => setReceiptRow(null)}
      />

      <ProviderSheet
        row={waRow}
        service={service}
        pickup={pickup}
        dropoff={dropoff}
        pickupPlace={draft.pickup}
        dropoffPlace={draft.dropoff}
        paymentLabel={paymentLabel}
        errandLabel={errandKind?.label}
        itemCount={itemCount}
        onClose={() => setWaRow(null)}
        onShowReceipt={() => {
          const row = waRow
          setWaRow(null)
          setReceiptRow(row)
        }}
      />
    </div>
  )
}