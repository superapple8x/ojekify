import type { Zone } from '../api/types'

const R_METERS = 6_371_000 // Earth radius in meters
const R_KM = 6_371

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Haversine distance between two lat/lng points in meters.
 * Single source of truth — also used by priceEngine.distanceKm.
 */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const hav =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
  const c = 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav))
  return R_METERS * c
}

/** Haversine distance in km (convenience alias). */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  return distanceMeters(a, b) / 1000
}

/** Back-compat alias for priceEngine (R=6371 km version). Kept for precision parity. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const hav =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R_KM * 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav))
}

/**
 * Find nearest zone to a point. Linear scan — 10 zones, negligible cost.
 * Returns zone + straight-line distance in meters.
 */
export function nearestZone(
  zones: Zone[],
  point: { lat: number; lng: number },
): { zone: Zone; meters: number } {
  if (zones.length === 0) throw new Error('nearestZone: empty zones')
  let best = zones[0]
  let bestMeters = distanceMeters(point, best)
  for (let i = 1; i < zones.length; i++) {
    const m = distanceMeters(point, zones[i])
    if (m < bestMeters) {
      best = zones[i]
      bestMeters = m
    }
  }
  return { zone: best, meters: bestMeters }
}
