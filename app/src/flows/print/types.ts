import { DEFAULT_PRINT_DRAFT } from '../../api'
import type { BindingId, PaperSizeId, PaperWeightId, PrintColorMode } from '../../api'

export interface PrintUpload {
  name: string
  sizeBytes: number
  pageCount: number | null
}

export interface PrintDraft {
  file: PrintUpload | null
  colorMode: PrintColorMode
  /** Halaman 1..mixedBwEnd dicetak hitam putih, sisanya warna (mode campuran). */
  mixedBwEnd: number
  paper: PaperSizeId
  weight: PaperWeightId
  binding: BindingId
  /** Nama + fakultas untuk template order whatsapp cetak & antar. */
  customerName: string
  /** Zona tujuan antar hasil cetak, dipakai untuk estimasi ongkir. */
  deliverToZoneId: string
}

export const EMPTY_PRINT_DRAFT: PrintDraft = {
  file: null,
  ...DEFAULT_PRINT_DRAFT,
  mixedBwEnd: 0,
  customerName: '',
  deliverToZoneId: '',
}

export const PRINT_STEP_LABELS = ['File', 'Pengaturan', 'Ringkasan'] as const
export type PrintStepIndex = 0 | 1 | 2