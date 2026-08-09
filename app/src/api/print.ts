import type {
  BindingId,
  PaperSizeId,
  PaperWeightId,
  PdfDescriptor,
  PrintColorMode,
  Zone,
} from './types'

/**
 * Mock "fotokopian mitra" untuk order Cetak & Antar.
 * Real backend: daftar mitra fotokopian dari API + tarif ongkirnya.
 */
export const PRINT_PARTNER = {
  id: 'print-partner',
  name: 'Fotokopi Mitra',
  emoji: '🖨️',
  phone: '628123456001',
} as const

/** Tarif per halaman (lokal kampus, mirip `print_request.txt`). */
export const PRINT_RATES = {
  bw: 500,
  color: 2_000,
} as const

export interface PrintDeliveryEstimate {
  base: number
  casPrint: number
  total: number
}

/**
 * Mock estimasi ongkir: base sesuai area tujuan + "cas print"
 * (provider menunggu di fotokopian). Real backend: hitung via aggregator.
 */
export function estimatePrintDeliveryFee(zone: Zone | undefined): PrintDeliveryEstimate {
  const base = zone && zone.area === 'luar' ? 8_000 : 6_000
  const casPrint = 2_000
  return { base, casPrint, total: base + casPrint }
}

export interface PrintJobEstimate {
  bwPages: number
  colorPages: number
  printCost: number
  finishingCost: number
  subtotal: number
  deliveryFee: PrintDeliveryEstimate
  total: number
}

/**
 * Split-cost estimator: biaya cetak (halaman × tarif) + jilid
 * dipisah dari ongkir + cas print, lalu dijumlah jadi total.
 */
export function estimatePrintJob(
  draft: {
    colorMode: PrintColorMode
    mixedBwEnd: number
    binding: BindingId
    pageCount: number
  },
  zone: Zone | undefined,
): PrintJobEstimate {
  const bwPages =
    draft.colorMode === 'bw'
      ? draft.pageCount
      : draft.colorMode === 'mixed'
        ? Math.min(Math.max(draft.mixedBwEnd, 0), draft.pageCount)
        : 0
  const colorPages = draft.pageCount - bwPages
  const printCost = bwPages * PRINT_RATES.bw + colorPages * PRINT_RATES.color
  const finishingCost = BINDINGS_BY_ID[draft.binding].price
  const deliveryFee = estimatePrintDeliveryFee(zone)
  return {
    bwPages,
    colorPages,
    printCost,
    finishingCost,
    subtotal: printCost + finishingCost,
    deliveryFee,
    total: printCost + finishingCost + deliveryFee.total,
  }
}

/**
 * Mock tautan unduh aman (real backend: cloud upload + auto-delete 24 jam).
 * Deterministic dari nama file + ukuran agar tautan sama saat file yang
 * sama diproses ulang.
 */
export function mockPrintFileLink(file: PdfDescriptor): string {
  const stem =
    file.name
      .replace(/\.pdf$/i, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 20) || 'file'
  const seed = `${file.name}-${file.sizeBytes}`
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  const code = Math.abs(hash).toString(36).slice(0, 6)
  return `pilihjek.com/print/${stem}-${code}`
}

/**
 * Mock "scan": backend nyata akan menghitung jumlah halaman PDF asli.
 * Deterministic dari ukuran file (≈ 46 KB/halaman) agar hasil sama saat
 * file yang sama diproses ulang.
 */
export function mockPdfPageCount({ sizeBytes }: PdfDescriptor): number {
  const pages = Math.round(sizeBytes / 46_000)
  return Math.min(500, Math.max(1, pages))
}

export const COLOR_MODES: { id: PrintColorMode; emoji: string; label: string; description: string }[] = [
  {
    id: 'bw',
    emoji: '⚫',
    label: 'Hitam Putih',
    description: 'Seluruh halaman hitam putih — paling hemat.',
  },
  {
    id: 'color',
    emoji: '🎨',
    label: 'Full Warna',
    description: 'Seluruh halaman dicetak warna.',
  },
  {
    id: 'mixed',
    emoji: '🌗',
    label: 'Campuran',
    description: 'Sebagian hitam putih, sisanya warna (custom).',
  },
]

export const PAPER_SIZES: { id: PaperSizeId; label: string; dims: string }[] = [
  { id: 'a4', label: 'A4', dims: '21,0 × 29,7 cm' },
  { id: 'f4', label: 'F4', dims: '21,5 × 33,0 cm' },
  { id: 'a3', label: 'A3', dims: '29,7 × 42,0 cm' },
]

export const PAPER_WEIGHTS: { id: PaperWeightId; label: string }[] = [
  { id: '70', label: 'HVS 70 gr' },
  { id: '80', label: 'HVS 80 gr' },
]

export const BINDINGS: { id: BindingId; emoji: string; label: string; description: string; price: number }[] = [
  { id: 'none', emoji: '📎', label: 'Tidak ada (klip kertas)', description: 'Langsung diantar, disatukan paperclip.', price: 0 },
  { id: 'staples', emoji: '🖇️', label: 'Staples', description: 'Dijepret rapi di pojok kiri.', price: 1_000 },
  { id: 'tape', emoji: '📦', label: 'Jilid Lakban', description: 'Standar skripsi/laporan.', price: 5_000 },
  { id: 'spiral', emoji: '🌀', label: 'Jilid Spiral', description: 'Bisa dibuka rata, cocok dokumen sering dibaca.', price: 15_000 },
]

export const BINDINGS_BY_ID = Object.fromEntries(
  BINDINGS.map((binding) => [binding.id, binding]),
) as Record<BindingId, (typeof BINDINGS)[number]>

export const DEFAULT_PRINT_DRAFT = {
  colorMode: 'bw' as PrintColorMode,
  paper: 'a4' as PaperSizeId,
  weight: '70' as PaperWeightId,
  binding: 'none' as BindingId,
}