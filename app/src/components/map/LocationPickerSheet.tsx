import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CAMPUS_CENTER, ZONES, ZONES_BY_ID } from '../../api/zones'
import type { PlaceSource, SelectedPlace } from '../../api/types'
import { Button, Chip, Modal } from '../../components'
import { nearestZone } from '../../lib/geo'
import { reverseGeocode, searchPlaces, type GeocodeResult } from '../../lib/geocode'
import { useSavedPlaces } from '../../hooks/useSavedPlaces'
import { MapCanvas } from './MapCanvas'

export interface LocationPickerSheetProps {
  open: boolean
  onClose: () => void
  value: SelectedPlace | null
  onChange: (place: SelectedPlace) => void
  title?: string
}

export function LocationPickerSheet({
  open,
  onClose,
  value,
  onChange,
  title = 'Pilih lokasi',
}: LocationPickerSheetProps) {
  const { places } = useSavedPlaces()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [searching, setSearching] = useState(false)
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    value ? { lat: value.lat, lng: value.lng } : null,
  )
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(
    value ? { lat: value.lat, lng: value.lng } : CAMPUS_CENTER,
  )
  const [pending, setPending] = useState<GeocodeResult | null>(null)
  const [pendingSource, setPendingSource] = useState<PlaceSource>('pin')
  const [reverseDetail, setReverseDetail] = useState<string | undefined>(value?.detail)
  const [reverseLoading, setReverseLoading] = useState(false)
  const [gpsState, setGpsState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [gpsHint, setGpsHint] = useState<string | null>(null)

  const searchAbortRef = useRef<AbortController | null>(null)
  const reverseAbortRef = useRef<AbortController | null>(null)
  const reverseTimerRef = useRef<number | null>(null)

  // Sync from value when sheet opens / value changes externally
  useEffect(() => {
    if (!open) return
    if (value) {
      setMarker({ lat: value.lat, lng: value.lng })
      setMapCenter({ lat: value.lat, lng: value.lng })
      setPending({ label: value.label, detail: value.detail, lat: value.lat, lng: value.lng })
      setPendingSource(value.source)
      setReverseDetail(value.detail)
    } else {
      setMarker(null)
      setMapCenter(CAMPUS_CENTER)
      setPending(null)
      setReverseDetail(undefined)
      setPendingSource('pin')
    }
    setQuery('')
    setResults([])
    setSearching(false)
    setGpsState('idle')
    setGpsHint(null)
  }, [open, value])

  // Debounced search ~300ms + AbortController
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      setSearching(false)
      searchAbortRef.current?.abort()
      return
    }

    setSearching(true)
    const timer = window.setTimeout(async () => {
      searchAbortRef.current?.abort()
      const controller = new AbortController()
      searchAbortRef.current = controller
      const lat = marker?.lat ?? mapCenter.lat
      const lng = marker?.lng ?? mapCenter.lng
      const hits = await searchPlaces(q, {
        signal: controller.signal,
        limit: 6,
        lat,
        lng,
      })
      if (controller.signal.aborted) return
      setResults(hits)
      setSearching(false)
    }, 300)

    return () => {
      clearTimeout(timer)
      // keep abort for next effect; don't abort immediately on debounce cancel
    }
  }, [query, marker?.lat, marker?.lng, mapCenter.lat, mapCenter.lng])

  // Debounced reverse geocode ~500ms when marker moves
  const scheduleReverse = useCallback(
    (pos: { lat: number; lng: number }) => {
      if (reverseTimerRef.current) window.clearTimeout(reverseTimerRef.current)
      reverseAbortRef.current?.abort()
      setReverseLoading(true)
      reverseTimerRef.current = window.setTimeout(async () => {
        const controller = new AbortController()
        reverseAbortRef.current = controller
        const hit = await reverseGeocode(pos.lat, pos.lng, { signal: controller.signal })
        if (controller.signal.aborted) return
        if (hit) {
          setReverseDetail(hit.detail ?? hit.label)
          // keep pending label if source was pin/gps but update detail
          setPending((prev) => {
            if (!prev) return hit
            // if pending source is search/zone/saved, keep it until explicit change
            if (pendingSource === 'search' || pendingSource === 'zone' || pendingSource === 'saved') {
              return prev
            }
            return hit
          })
        } else {
          setReverseDetail(undefined)
        }
        setReverseLoading(false)
      }, 500)
    },
    [pendingSource],
  )

  useEffect(() => {
    return () => {
      if (reverseTimerRef.current) window.clearTimeout(reverseTimerRef.current)
      searchAbortRef.current?.abort()
      reverseAbortRef.current?.abort()
    }
  }, [])

  const handleMarkerChange = useCallback(
    (pos: { lat: number; lng: number }) => {
      setMarker(pos)
      setMapCenter(pos)
      setPendingSource('pin')
      // clear search-persisted pending so reverse can update label
      setPending((prev) => {
        if (prev && (pendingSource === 'search' || pendingSource === 'zone' || pendingSource === 'saved')) {
          return null
        }
        return prev
      })
      scheduleReverse(pos)
    },
    [pendingSource, scheduleReverse],
  )

  const handleSelectSearch = useCallback(
    (hit: GeocodeResult) => {
      setMarker({ lat: hit.lat, lng: hit.lng })
      setMapCenter({ lat: hit.lat, lng: hit.lng })
      setPending(hit)
      setPendingSource('search')
      setReverseDetail(hit.detail)
      setQuery('')
      setResults([])
    },
    [],
  )

  const handleQuickPick = useCallback((zoneId: string) => {
    const zone = ZONES_BY_ID[zoneId]
    if (!zone) return
    const pos = { lat: zone.lat, lng: zone.lng }
    setMarker(pos)
    setMapCenter(pos)
    setPending({ label: zone.name, detail: zone.area === 'kampus' ? 'Dalam Kampus' : 'Luar Kampus', lat: zone.lat, lng: zone.lng })
    setPendingSource('zone')
    setReverseDetail(zone.area === 'kampus' ? 'Dalam Kampus, Indralaya' : 'Luar Kampus, Indralaya')
  }, [])

  const handleSavedPick = useCallback(
    (savedId: string) => {
      const saved = places.find((p) => p.id === savedId)
      if (!saved) return
      const zone = ZONES_BY_ID[saved.zoneId]
      // migration: old SavedPlace has no lat/lng — fallback to zone coords
      // new shape will have lat/lng on the SelectedPlace itself
      const pos = zone ? { lat: zone.lat, lng: zone.lng } : CAMPUS_CENTER
      setMarker(pos)
      setMapCenter(pos)
      setPending({ label: saved.label, detail: zone?.name, lat: pos.lat, lng: pos.lng })
      setPendingSource('saved')
      setReverseDetail(zone?.name)
    },
    [places],
  )

  const handleGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsState('error')
      setGpsHint('Geolocation tidak didukung di browser ini.')
      return
    }
    setGpsState('loading')
    setGpsHint(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setMarker(next)
        setMapCenter(next)
        setPendingSource('gps')
        setPending(null)
        setGpsState('idle')
        scheduleReverse(next)
      },
      (err) => {
        setGpsState('error')
        if (err.code === 1) setGpsHint('Izin lokasi ditolak — geser pin manual atau cari alamat.')
        else if (err.code === 2) setGpsHint('Lokasi tidak tersedia — coba lagi atau geser pin.')
        else if (err.code === 3) setGpsHint('Timeout — coba lagi atau geser pin.')
        else setGpsHint('Gagal mendapatkan lokasi — coba lagi.')
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }, [scheduleReverse])

  const nearest = useMemo(() => {
    if (!marker) return null
    try {
      return nearestZone(ZONES, marker)
    } catch {
      return null
    }
  }, [marker])

  const canConfirm = Boolean(marker && nearest)

  const handleConfirm = useCallback(() => {
    if (!marker || !nearest) return
    const label = pending?.label ?? reverseDetail ?? nearest.zone.name
    const detail = pending?.detail ?? reverseDetail
    const place: SelectedPlace = {
      label,
      detail,
      lat: marker.lat,
      lng: marker.lng,
      zoneId: nearest.zone.id,
      source: pendingSource,
    }
    onChange(place)
    onClose()
  }, [marker, nearest, pending, reverseDetail, pendingSource, onChange, onClose])

  const addressCaption = reverseLoading
    ? 'Memuat alamat…'
    : (pending?.detail ?? reverseDetail ?? (marker ? 'Geser pin untuk memilih lokasi' : 'Cari alamat atau geser pin'))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <Button block disabled={!canConfirm} onClick={handleConfirm}>
          Gunakan lokasi ini
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <div className="relative">
            <span aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-neutral-400">
              🔍
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari alamat, gedung, atau tempat…"
              className="h-11 w-full rounded-xl border-2 border-neutral-200 bg-white py-2 pr-9 pl-10 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results.length > 0) {
                  e.preventDefault()
                  handleSelectSearch(results[0])
                }
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Hapus pencarian"
                className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search states */}
          {query.trim() && (
            <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              {searching ? (
                <p className="px-3 py-3 text-xs text-neutral-400">Mencari…</p>
              ) : results.length > 0 ? (
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {results.map((hit, idx) => (
                    <li key={`${hit.label}-${idx}`}>
                      <button
                        type="button"
                        onClick={() => handleSelectSearch(hit)}
                        className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      >
                        <span aria-hidden className="mt-0.5 text-neutral-400">📍</span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">{hit.label}</span>
                          {hit.detail && (
                            <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">{hit.detail}</span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-3 text-xs text-neutral-400">Tidak ada hasil — coba kata kunci lain atau geser pin.</p>
              )}
            </div>
          )}

          {/* Empty-query: saved + quick picks */}
          {!query.trim() && (
            <div className="space-y-3">
              {places.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    ⭐ Tempat tersimpan
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {places.map((place) => {
                      const zone = ZONES_BY_ID[place.zoneId]
                      return (
                        <Chip
                          key={place.id}
                          onClick={() => handleSavedPick(place.id)}
                          icon={<span aria-hidden>{zone?.emoji ?? '📍'}</span>}
                          size="sm"
                        >
                          {place.label}
                        </Chip>
                      )
                    })}
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Zona populer</p>
                <div className="flex flex-wrap gap-2">
                  {ZONES.slice(0, 8).map((zone) => (
                    <Chip
                      key={zone.id}
                      onClick={() => handleQuickPick(zone.id)}
                      icon={<span aria-hidden>{zone.emoji}</span>}
                      size="sm"
                    >
                      {zone.name}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleGps}
          disabled={gpsState === 'loading'}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:border-brand-400 hover:text-brand-600 disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-brand-500/50"
        >
          {gpsState === 'loading' ? 'Mencari lokasi…' : '📍 Gunakan lokasi saya'}
        </button>
        {gpsHint && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" role="status">
            {gpsHint}
          </p>
        )}

        <div className="space-y-2">
          <MapCanvas
            center={mapCenter}
            zoom={15}
            marker={marker}
            onMarkerChange={handleMarkerChange}
            className="h-64 sm:h-72"
          />
          <p className="flex items-start gap-1.5 rounded-xl bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            <span aria-hidden>📍</span>
            <span className="min-w-0 flex-1 truncate">{addressCaption}</span>
            {reverseLoading && <span className="size-3 animate-spin rounded-full border-2 border-neutral-300 border-t-brand-500" aria-hidden />}
          </p>
        </div>

        {nearest && (
          <p className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300" aria-live="polite">
            Tarif dihitung dari zona terdekat: {nearest.zone.emoji} {nearest.zone.name} (± {Math.round(nearest.meters)} m)
          </p>
        )}
      </div>
    </Modal>
  )
}
