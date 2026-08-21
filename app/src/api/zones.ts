import type { Zone } from './types'

export const CAMPUS_CENTER = { lat: -2.9117, lng: 104.6471 } as const

export const ZONES: Zone[] = [
  { id: 'kampus-utama', name: 'Dalam Kampus', area: 'kampus', emoji: '🏛️', lat: -2.9117, lng: 104.6471 },
  { id: 'fak-ekonomi', name: 'Fakultas Ekonomi', area: 'kampus', emoji: '💹', lat: -2.9085, lng: 104.6505 },
  { id: 'fak-teknik', name: 'Fakultas Teknik', area: 'kampus', emoji: '🔧', lat: -2.9148, lng: 104.6453 },
  { id: 'perpustakaan', name: 'Perpustakaan Pusat', area: 'kampus', emoji: '📚', lat: -2.912, lng: 104.6475 },
  { id: 'asrama-putih', name: 'Asrama (Dorm)', area: 'kampus', emoji: '🛏️', lat: -2.905, lng: 104.648 },
  { id: 'pasar-pagi', name: 'Pasar Pagi', area: 'luar', emoji: '🥬', lat: -2.925, lng: 104.654 },
  { id: 'alun-alun', name: 'Alun-Alun Kota', area: 'luar', emoji: '🌳', lat: -2.928, lng: 104.657 },
  { id: 'kost-mutiara', name: 'Kost Mutiara Indah', area: 'luar', emoji: '🌸', lat: -2.92, lng: 104.66 },
  { id: 'griya-sejahtera', name: 'Griya Sejahtera', area: 'luar', emoji: '🏠', lat: -2.915, lng: 104.665 },
  { id: 'rs-kampus', name: 'RS Kampus', area: 'luar', emoji: '🏥', lat: -2.93, lng: 104.64 },
]

export const ZONES_BY_ID: Record<string, Zone> = Object.fromEntries(
  ZONES.map((zone) => [zone.id, zone]),
)

export function getZone(id: string): Zone {
  const zone = ZONES_BY_ID[id]
  if (!zone) throw new Error(`Zona tidak dikenal: ${id}`)
  return zone
}