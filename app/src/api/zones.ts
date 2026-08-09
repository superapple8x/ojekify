import type { Zone } from './types'

export const ZONES: Zone[] = [
  { id: 'kampus-utama', name: 'Dalam Kampus', area: 'kampus', emoji: '🏛️', x: 0.5, y: 1.6 },
  { id: 'fak-ekonomi', name: 'Fakultas Ekonomi', area: 'kampus', emoji: '💹', x: 0.3, y: 1.1 },
  { id: 'fak-teknik', name: 'Fakultas Teknik', area: 'kampus', emoji: '🔧', x: 0.9, y: 1.3 },
  { id: 'perpustakaan', name: 'Perpustakaan Pusat', area: 'kampus', emoji: '📚', x: 0.7, y: 2.0 },
  { id: 'asrama-putih', name: 'Asrama (Dorm)', area: 'kampus', emoji: '🛏️', x: 1.0, y: 2.4 },
  { id: 'pasar-pagi', name: 'Pasar Pagi', area: 'luar', emoji: '🥬', x: 1.4, y: 0.8 },
  { id: 'alun-alun', name: 'Alun-Alun Kota', area: 'luar', emoji: '🌳', x: 1.6, y: 0.4 },
  { id: 'kost-mutiara', name: 'Kost Mutiara Indah', area: 'luar', emoji: '🌸', x: 1.9, y: 1.2 },
  { id: 'griya-sejahtera', name: 'Griya Sejahtera', area: 'luar', emoji: '🏠', x: 2.1, y: 2.1 },
  { id: 'rs-kampus', name: 'RS Kampus', area: 'luar', emoji: '🏥', x: 2.6, y: 0.6 },
]

export const ZONES_BY_ID: Record<string, Zone> = Object.fromEntries(
  ZONES.map((zone) => [zone.id, zone]),
)

export function getZone(id: string): Zone {
  const zone = ZONES_BY_ID[id]
  if (!zone) throw new Error(`Zona tidak dikenal: ${id}`)
  return zone
}