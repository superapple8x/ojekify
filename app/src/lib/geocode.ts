/**
 * Photon geocoder — swap point for future backend proxy.
 *
 * Public instance: https://photon.komoot.io (CORS-enabled, no API key,
 * `lang=id`). For production, replace `PHOTON_BASE` with your own proxy
 * (same query params) to avoid rate limits / add caching. The public
 * instance is fine for demo and local dev.
 *
 * Both helpers never throw to UI — network / parse errors return `[]` / `null`.
 * `searchPlacesWithStatus` additionally reports `offline` so callers can
 * distinguish "no results" from "no connection".
 *
 * Hardening: 8s request timeout (callers pass no timeout of their own),
 * 60s in-memory cache (rounded keys), and a South-Sumatra `bbox` so
 * generic queries like "Pasar" stay near Indralaya instead of matching
 * across Indonesia.
 */

import { CAMPUS_CENTER } from '../api/zones'

const PHOTON_BASE = 'https://photon.komoot.io'
const DEFAULT_LIMIT = 6
const LANG = 'id'
const REQUEST_TIMEOUT_MS = 8_000
const CACHE_TTL_MS = 60_000
const MAX_CACHE_ENTRIES = 200
// South Sumatra focus window: minLon,minLat,maxLon,maxLat
const BBOX = '103.9,-3.3,105.3,-2.5'

/** Combine a caller signal with a timeout. Falls back gracefully. */
function effectiveSignal(signal: AbortSignal | undefined, ms: number): AbortSignal | undefined {
  const AugSignal = AbortSignal as unknown as {
    timeout?: (ms: number) => AbortSignal
    any?: (signals: AbortSignal[]) => AbortSignal
  }
  const timeout = typeof AugSignal.timeout === 'function' ? AugSignal.timeout(ms) : undefined
  if (signal && timeout && typeof AugSignal.any === 'function') {
    return AugSignal.any([signal, timeout])
  }
  return signal ?? timeout
}

interface CacheEntry<T> {
  at: number
  value: T
}

const SEARCH_CACHE = new Map<string, CacheEntry<GeocodeResult[]>>()
const REVERSE_CACHE = new Map<string, CacheEntry<GeocodeResult | null>>()

function cacheGet<T>(map: Map<string, CacheEntry<T>>, key: string): T | undefined {
  const entry = map.get(key)
  if (!entry) return undefined
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    map.delete(key)
    return undefined
  }
  return entry.value
}

function cacheSet<T>(map: Map<string, CacheEntry<T>>, key: string, value: T): void {
  if (map.size >= MAX_CACHE_ENTRIES) {
    const oldest = map.keys().next()
    if (!oldest.done) map.delete(oldest.value)
  }
  map.set(key, { at: Date.now(), value })
}

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

export interface SearchStatus {
  results: GeocodeResult[]
  /** True when the fetch failed with no connection (browser offline). */
  offline: boolean
}

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError'
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

export async function searchPlacesWithStatus(
  query: string,
  opts?: { signal?: AbortSignal; limit?: number; lat?: number; lng?: number },
): Promise<SearchStatus> {
  const q = query.trim()
  if (!q) return { results: [], offline: false }

  const limit = opts?.limit ?? DEFAULT_LIMIT
  const biasLat = opts?.lat ?? CAMPUS_CENTER.lat
  const biasLng = opts?.lng ?? CAMPUS_CENTER.lng

  const cacheKey = `${q.toLowerCase()}|${limit}|${biasLat.toFixed(3)}|${biasLng.toFixed(3)}`
  const cached = cacheGet(SEARCH_CACHE, cacheKey)
  if (cached) return { results: cached, offline: false }

  const params = new URLSearchParams({
    q,
    limit: String(limit),
    lang: LANG,
    lat: String(biasLat),
    lon: String(biasLng),
    bbox: BBOX,
  })

  const url = `${PHOTON_BASE}/api/?${params.toString()}`

  try {
    const res = await fetch(url, { signal: effectiveSignal(opts?.signal, REQUEST_TIMEOUT_MS) })
    if (!res.ok) return { results: [], offline: false }
    const data = (await res.json()) as PhotonResponse
    const features = Array.isArray(data.features) ? data.features : []
    const results: GeocodeResult[] = []
    for (const feature of features) {
      const normalized = normalizeFeature(feature)
      if (normalized) results.push(normalized)
    }
    cacheSet(SEARCH_CACHE, cacheKey, results)
    return { results, offline: false }
  } catch (e) {
    if (isAbortError(e)) return { results: [], offline: false }
    return { results: [], offline: isOffline() }
  }
}

export async function searchPlaces(
  query: string,
  opts?: { signal?: AbortSignal; limit?: number; lat?: number; lng?: number },
): Promise<GeocodeResult[]> {
  return (await searchPlacesWithStatus(query, opts)).results
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  opts?: { signal?: AbortSignal },
): Promise<GeocodeResult | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const cacheKey = `${lat.toFixed(5)}|${lng.toFixed(5)}`
  const cached = cacheGet(REVERSE_CACHE, cacheKey)
  if (cached !== undefined) return cached

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    lang: LANG,
  })
  const url = `${PHOTON_BASE}/reverse?${params.toString()}`

  try {
    const res = await fetch(url, { signal: effectiveSignal(opts?.signal, REQUEST_TIMEOUT_MS) })
    if (!res.ok) return null
    const data = (await res.json()) as PhotonResponse
    const features = Array.isArray(data.features) ? data.features : []
    const first = features[0]
    if (!first) return null
    const normalized = normalizeFeature(first)
    cacheSet(REVERSE_CACHE, cacheKey, normalized)
    return normalized
  } catch {
    return null
  }
}
