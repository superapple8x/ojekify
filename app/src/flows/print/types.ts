import { DEFAULT_PRINT_DRAFT } from '../../api'
import type { BindingId, PaperSizeId, PaperWeightId, PrintColorMode, SelectedPlace } from '../../api'

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
  /** Tujuan antar hasil cetak — tarif tetap dihitung dari zona terdekat (`zoneId`). */
  deliverTo: SelectedPlace | null
}

export const EMPTY_PRINT_DRAFT: PrintDraft = {
  file: null,
  ...DEFAULT_PRINT_DRAFT,
  mixedBwEnd: 0,
  customerName: '',
  deliverTo: null,
}

export const PRINT_STEP_LABELS = ['File', 'Pengaturan', 'Ringkasan'] as const
export type PrintStepIndex = 0 | 1 | 2