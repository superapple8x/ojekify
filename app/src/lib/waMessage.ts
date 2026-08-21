import type { Provider, Quote, SelectedPlace, WaFieldId, WaTemplate } from '../api'
import { formatIDR } from './format'

export const WA_FIELD_LABELS: Record<WaFieldId, string> = {
  service: 'Layanan',
  pickup: 'Jemput',
  dropoff: 'Antar',
  payment: 'Bayar',
  items: 'Jumlah item',
  notes: 'Catatan',
}

export type WaMessageInput = {
  provider: Provider
  quote: Quote
  serviceLabel: string
  pickupName: string
  dropoffName: string
  pickupPlace?: SelectedPlace | null
  dropoffPlace?: SelectedPlace | null
  paymentLabel: string
  customerName?: string
  itemCount?: number
  notes?: string
}

function formatPlaceWithMapsLink(place: SelectedPlace): string {
  const head = place.detail ? `${place.label} — ${place.detail}` : place.label
  return `${head}\n🗺️ https://maps.google.com/?q=${place.lat},${place.lng}`
}

function fieldValue(field: WaFieldId, input: WaMessageInput): string | undefined {
  switch (field) {
    case 'service':
      return input.serviceLabel
    case 'pickup':
      if (input.pickupPlace) return formatPlaceWithMapsLink(input.pickupPlace)
      return input.pickupName
    case 'dropoff':
      if (input.dropoffPlace) return formatPlaceWithMapsLink(input.dropoffPlace)
      return input.dropoffName
    case 'payment':
      return input.paymentLabel
    case 'items':
      if (!input.itemCount || input.itemCount <= 0) return undefined
      return `${input.itemCount} item`
    case 'notes':
      return input.notes?.trim() || undefined
  }
}

function fareSummary(quote: Quote): string {
  if (quote.lines.length <= 1) {
    return `*Harga sepakat dari App:* ${formatIDR(quote.total)}`
  }
  const breakdown = quote.lines
    .map((line) => `${line.label}: ${formatIDR(line.amount)}`)
    .join(', ')
  return `*Harga sepakat dari App:* ${formatIDR(quote.total)}\n(${breakdown})`
}

export function buildWaMessage(input: WaMessageInput): string {
  const template: WaTemplate = input.provider.waTemplate
  const glue = template.separator.includes(' ')
    ? template.separator
    : `${template.separator} `

  const parts: string[] = []
  if (template.needsName && input.customerName?.trim()) {
    parts.push(`Nama: ${input.customerName.trim()}`)
  }
  for (const field of template.fields) {
    const value = fieldValue(field, input)
    if (value) parts.push(`${WA_FIELD_LABELS[field]}: ${value}`)
  }

  let message = template.greeting
  if (parts.length > 0) {
    message = message ? `${message}\n${parts.join(glue)}` : parts.join(glue)
  }

  if (template.includeFareSummary) {
    message = `${message}\n\n${fareSummary(input.quote)}`
  }

  return message.trim()
}