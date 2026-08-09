import type { OrderStatus } from '../api'
import type { TagVariant } from '../components'

export interface OrderStatusMeta {
  label: string
  emoji: string
  variant: TagVariant
  hint: string
}

export const ORDER_STATUSES: Record<OrderStatus, OrderStatusMeta> = {
  pending: {
    label: 'Menunggu konfirmasi',
    emoji: '⏳',
    variant: 'warning',
    hint: 'Admin belum balas di WhatsApp — biasanya < 15 menit.',
  },
  proses: {
    label: 'Lagi diurus',
    emoji: '🛺',
    variant: 'info',
    hint: 'Provider sudah konfirmasi, pesanan sedang dijalankan.',
  },
  selesai: {
    label: 'Selesai ✓',
    emoji: '✅',
    variant: 'success',
    hint: 'Pesanan sudah sampai. Jangan lupa nilai providernya!',
  },
  dibatalkan: {
    label: 'Dibatalkan',
    emoji: '✕',
    variant: 'danger',
    hint: 'Pesanan batal — saldo tidak terpotong.',
  },
}

export const ORDER_STATUS_IDS = Object.keys(ORDER_STATUSES) as OrderStatus[]

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['pending', 'proses']