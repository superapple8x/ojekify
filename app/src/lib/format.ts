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