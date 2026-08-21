import type {
  ComparisonResult,
  ComparisonRow,
  FareBand,
  Provider,
  Quote,
  QuoteRequest,
  ReceiptLine,
} from './types'
import { getZone } from './zones'
import { distanceKm } from '../lib/geo'

// Re-export for call sites that imported from priceEngine (RouteStep etc.)
export { distanceKm }

function baseFare(bands: FareBand[], km: number): number {
  for (const band of bands) {
    if (km <= band.maxKm) return band.price
  }
  return bands[bands.length - 1]?.price ?? 0
}

function itemCasSteps(bands: { startAt: number; step: number }, count: number): number {
  if (count < bands.startAt) return 0
  return Math.floor((count - bands.startAt) / bands.step) + 1
}

function topupFee(tiers: { upto: number | null; fee: number }[], amount: number): number {
  let fee = 0
  for (const tier of tiers) {
    if (tier.upto === null || amount <= tier.upto) {
      fee = tier.fee
      break
    }
  }
  return fee
}

export function computeQuote(provider: Provider, request: QuoteRequest): Quote {
  const { service, conditions, extras } = request
  const pickup = getZone(request.pickupZoneId)
  const dropoff = getZone(request.dropoffZoneId)
  const bands = provider.fares[service]
  if (!bands) {
    throw new Error(`${provider.name} tidak melayani ${service}`)
  }

  const km = distanceKm(pickup, dropoff)
  const lines: ReceiptLine[] = [
    { kind: 'base', label: 'Biaya Dasar', amount: baseFare(bands, km) },
  ]

  const addCas = (label: string, amount: number, detail?: string) => {
    if (amount > 0) lines.push({ kind: 'cas', label, amount, detail })
  }

  if (conditions.raining) {
    addCas('Cas Hujan', provider.cas.rain)
  }
  if (conditions.payment === 'noncash') {
    addCas('Cas Non-Tunai', provider.cas.cashless)
  }
  if (conditions.hour >= provider.cas.night.from) {
    addCas('Cas Luar Jam (Malam)', provider.cas.night.fee, `mulai jam ${provider.cas.night.from}.00`)
  }

  const itemCount = extras?.itemCount ?? 0
  if (provider.cas.itemFee) {
    const steps = itemCasSteps(provider.cas.itemFee, itemCount)
    if (steps > 0) {
      addCas(
        'Cas Kelipatan Item',
        steps * provider.cas.itemFee.fee,
        `${itemCount} item (tambah ${steps} langkah)`,
      )
    }
  }

  const extraStores = extras?.extraStores ?? 0
  if (extraStores > 0) {
    addCas('Cas Mampir', provider.cas.perStore * extraStores, `${extraStores} toko tambahan`)
  }

  const topupAmount = extras?.topupAmount
  if (topupAmount !== undefined && topupAmount > 0) {
    addCas('Cas Top-up', topupFee(provider.cas.topup, topupAmount), `nominal Rp ${topupAmount}`)
  }

  return {
    providerId: provider.id,
    service,
    pickupZoneId: request.pickupZoneId,
    dropoffZoneId: request.dropoffZoneId,
    distanceKm: km,
    total: lines.reduce((sum, line) => sum + line.amount, 0),
    lines,
  }
}

export function compareQuotes(providers: Provider[], request: QuoteRequest): ComparisonResult {
  const rows: ComparisonRow[] = providers.map((provider) => ({
    provider,
    quote: computeQuote(provider, request),
    tag: null,
    rank: 0,
  }))

  rows.sort(
    (a, b) =>
      a.quote.total - b.quote.total ||
      a.provider.responseTimeMinutes - b.provider.responseTimeMinutes ||
      a.provider.name.localeCompare(b.provider.name),
  )

  const cheapestTotal = rows[0]?.quote.total
  const fastestResponse = Math.min(...rows.map((row) => row.provider.responseTimeMinutes))

  rows.forEach((row, index) => {
    row.rank = index + 1
    if (cheapestTotal !== undefined && row.quote.total === cheapestTotal) {
      row.tag = 'cheapest'
    } else if (row.provider.responseTimeMinutes === fastestResponse) {
      row.tag = 'fastest'
    } else if (row.provider.noHiddenFees) {
      row.tag = 'noHiddenFees'
    }
  })

  return { rows }
}

export function getQuote(providers: Provider[], providerId: string, request: QuoteRequest) {
  const provider = providers.find((candidate) => candidate.id === providerId)
  if (!provider) return undefined
  return computeQuote(provider, request)
}