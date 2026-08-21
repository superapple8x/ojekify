import type { SelectedPlace } from '../api'
import { formatIDR } from './format'
import { formatPlaceWithMapsLink } from './waMessage'

export interface PrintWaMessageInput {
  customerName: string
  deliverToName: string
  deliverToPlace?: SelectedPlace | null
  fileName: string
  pageCount: number
  paperLabel: string
  weightLabel: string
  colorLabel: string
  finishingLabel: string
  fileLink: string
  printCost: number
  deliveryFee: number
  total: number
}

export function buildPrintWaMessage(input: PrintWaMessageInput): string {
  const deliverTo = input.deliverToPlace
    ? formatPlaceWithMapsLink(input.deliverToPlace)
    : input.deliverToName
  const lines = [
    '[ORDER: PRINT & DELIVER] 🖨️🛵',
    `Name: ${input.customerName}`,
    `Deliver To: ${deliverTo}`,
    '',
    '-- PRINT INSTRUCTIONS --',
    `File: ${input.fileName} (${input.pageCount} halaman)`,
    `Paper: ${input.paperLabel}, ${input.weightLabel}`,
    `Color: ${input.colorLabel}`,
    `Finishing: ${input.finishingLabel}`,
    '',
    '-- SECURE DOWNLOAD LINK --',
    `👉 ${input.fileLink}`,
    '(Admin: buka link ini langsung dari komputer fotokopian untuk download & cetak — tanpa download di HP.)',
    '',
    `Estimated Print Cost: ~${formatIDR(input.printCost)}`,
    `Delivery Fee: ${formatIDR(input.deliveryFee)}`,
    `Total to Pay: ~${formatIDR(input.total)} (Tunai)`,
  ]
  return lines.join('\n')
}