export function formatIDR(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`
}

export function formatKm(km: number): string {
  return `${km.toFixed(1).replace('.', ',')} km`
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

export function formatTimeAgo(timestamp: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - timestamp)
  if (diff < MINUTE_MS) return 'baru saja'
  if (diff < HOUR_MS) return `${Math.floor(diff / MINUTE_MS)} mnt lalu`
  if (diff < DAY_MS) return `${Math.floor(diff / HOUR_MS)} jam lalu`
  return `${Math.floor(diff / DAY_MS)} hari lalu`
}