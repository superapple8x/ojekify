/**
 * Photon geocoder — swap point for future backend proxy.
 *
 * Public instance: https://photon.komoot.io (CORS-enabled, no API key,
 * `lang=id`). For production, replace `PHOTON_BASE` with your own proxy
 * (same query params) to avoid rate limits / add caching. The public
 * instance is fine for demo and local dev.
 *
 * Both helpers never throw to UI — network / parse errors return `[]` / `null`.
 */

import { CAMPUS_CENTER } from '../api/zones'

const PHOTON_BASE = 'https://photon.komoot.io'
const DEFAULT_LIMIT = 6
const LANG = 'id'

export interface GeocodeResult {
  label: string
  detail?: string
  lat: number
  lng: number
}

interface PhotonFeature {
  geometry: { coordinates: [number, number]; type: string }
  properties: {
    name?: string
    housenumber?: string
    street?: string
    district?: string
    city?: string
    county?: string
    state?: string
    country?: string
    postcode?: string
    [key: string]: unknown
  }
}

interface PhotonResponse {
  features?: PhotonFeature[]
}

function normalizeFeature(feature: PhotonFeature): GeocodeResult | null {
  const { geometry, properties } = feature
  const coords = geometry?.coordinates
  if (!Array.isArray(coords) || coords.length < 2) return null
  const lng = Number(coords[0])
  const lat = Number(coords[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const name = typeof properties.name === 'string' ? properties.name.trim() : ''
  const housenumber =
    typeof properties.housenumber === 'string' ? properties.housenumber.trim() : ''
  const street = typeof properties.street === 'string' ? properties.street.trim() : ''

  // label: name > "housenumber street" > street > city fallback
  let label = name
  if (!label) {
    const houseStreet = [housenumber, street].filter(Boolean).join(' ').trim()
    label = houseStreet || street
  }
  if (!label) {
    const city = typeof properties.city === 'string' ? properties.city.trim() : ''
    const state = typeof properties.state === 'string' ? properties.state.trim() : ''
    label = city || state || 'Lokasi terpilih'
  }

  const district =
    typeof properties.district === 'string' ? properties.district.trim() : ''
  const city = typeof properties.city === 'string' ? properties.city.trim() : ''
  const county = typeof properties.county === 'string' ? properties.county.trim() : ''
  const state = typeof properties.state === 'string' ? properties.state.trim() : ''

  // detail: district, city/county, state — avoid duplicating label when it is the city
  const detailParts = [district, city || county, state].filter(
    (part): part is string => Boolean(part && part !== label),
  )
  const detail = detailParts.length > 0 ? detailParts.join(', ') : undefined

  return { label, detail, lat, lng }
}

export async function searchPlaces(
  query: string,
  opts?: { signal?: AbortSignal; limit?: number; lat?: number; lng?: number },
): Promise<GeocodeResult[]> {
  const q = query.trim()
  if (!q) return []

  const limit = opts?.limit ?? DEFAULT_LIMIT
  const biasLat = opts?.lat ?? CAMPUS_CENTER.lat
  const biasLng = opts?.lng ?? CAMPUS_CENTER.lng

  const params = new URLSearchParams({
    q,
    limit: String(limit),
    lang: LANG,
    lat: String(biasLat),
    lon: String(biasLng),
  })

  const url = `${PHOTON_BASE}/api/?${params.toString()}`

  try {
    const res = await fetch(url, { signal: opts?.signal })
    if (!res.ok) return []
    const data = (await res.json()) as PhotonResponse
    const features = Array.isArray(data.features) ? data.features : []
    const results: GeocodeResult[] = []
    for (const feature of features) {
      const normalized = normalizeFeature(feature)
      if (normalized) results.push(normalized)
    }
    return results
  } catch {
    return []
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  opts?: { signal?: AbortSignal },
): Promise<GeocodeResult | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    lang: LANG,
  })
  const url = `${PHOTON_BASE}/reverse?${params.toString()}`

  try {
    const res = await fetch(url, { signal: opts?.signal })
    if (!res.ok) return null
    const data = (await res.json()) as PhotonResponse
    const features = Array.isArray(data.features) ? data.features : []
    const first = features[0]
    if (!first) return null
    return normalizeFeature(first)
  } catch {
    return null
  }
}
