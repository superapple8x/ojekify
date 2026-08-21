import { useEffect, useState } from 'react'
import { api, distanceKm } from '../../../api'
import type { SelectedPlace, Zone } from '../../../api'
import { formatKm } from '../../../lib/format'
import { Button, Chip, LocationPicker } from '../../../components'
import { useSavedPlaces } from '../../../hooks/useSavedPlaces'

export interface RouteStepProps {
  pickup: SelectedPlace | null
  dropoff: SelectedPlace | null
  onChange: (pickup: SelectedPlace | null, dropoff: SelectedPlace | null) => void
}

export function RouteStep({ pickup, dropoff: dropoffPlace, onChange }: RouteStepProps) {
  const [zones, setZones] = useState<Zone[]>([])
  const { places, savePlace, removePlace } = useSavedPlaces()
  const [placeLabel, setPlaceLabel] = useState('')

  useEffect(() => {
    let alive = true
    api.getZones().then((items) => alive && setZones(items))
    return () => {
      alive = false
    }
  }, [])

  const pickupZoneId = pickup?.zoneId ?? ''
  const bothChosen = Boolean(pickup && dropoffPlace)
  const sameZone = Boolean(pickup && dropoffPlace && pickup.zoneId === dropoffPlace.zoneId)

  return (
    <div className="space-y-5">
      {!bothChosen && (
        <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          Cari alamat, geser pin di peta, pakai GPS, atau pilih zona populer — tarif tetap dihitung dari zona
          terdekat.
        </p>
      )}

      {bothChosen && !sameZone && pickup && dropoffPlace && (
        <p className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          {pickup.label} → {dropoffPlace.label} ± {formatKm(distanceKm(pickup, dropoffPlace))}
        </p>
      )}

      {sameZone && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300" role="alert">
          Zona jemput dan antar tidak boleh sama, pilih zona lain ya — geser pin sedikit atau pilih zona lain.
        </p>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
          ⭐ Tempat tersimpan <span className="font-normal text-neutral-400 dark:text-neutral-500">— tap untuk mengisi jemputan</span>
        </p>
        {places.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {places.map((place) => {
              const zone = zones.find((candidate) => candidate.id === place.zoneId)
              return (
                <Chip
                  key={place.id}
                  selected={pickupZoneId === place.zoneId}
                  onClick={() => {
                    const next: SelectedPlace = {
                      label: place.label,
                      detail: place.detail,
                      lat: place.lat,
                      lng: place.lng,
                      zoneId: place.zoneId,
                      source: 'saved',
                    }
                    onChange(next, dropoffPlace)
                  }}
                  onRemove={() => removePlace(place.id)}
                  icon={<span aria-hidden>{zone?.emoji ?? '📍'}</span>}
                >
                  {place.label}
                </Chip>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            Belum ada tempat tersimpan — pilih zona jemput lalu simpan lewat form di bawah.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
        <div className="space-y-1.5">
          <label htmlFor="pickup" className="text-sm font-semibold">
            Jemput dari
          </label>
          <LocationPicker
            id="pickup"
            value={pickup}
            onChange={(next) => onChange(next, dropoffPlace)}
            placeholder="Pilih lokasi jemput…"
            title="Pilih lokasi jemput"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="dropoff" className="text-sm font-semibold">
            Antar ke
          </label>
          <LocationPicker
            id="dropoff"
            value={dropoffPlace}
            onChange={(next) => onChange(pickup, next)}
            placeholder="Pilih lokasi antar…"
            title="Pilih lokasi antar"
          />
        </div>
      </div>

      {bothChosen && !sameZone && (
        <button
          type="button"
          onClick={() => onChange(dropoffPlace, pickup)}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-neutral-200 px-3.5 py-1.5 text-xs font-semibold transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-neutral-800 dark:hover:border-brand-500/50 dark:hover:text-brand-300"
        >
          ⇄ Tukar jemput & antar
        </button>
      )}

      {pickup && (
        <form
          className="flex flex-col gap-2 rounded-2xl border-2 border-dashed border-neutral-200 p-3.5 dark:border-neutral-800 sm:flex-row sm:items-center"
          onSubmit={(event) => {
            event.preventDefault()
            savePlace(placeLabel || pickup.label, pickup)
            setPlaceLabel('')
          }}
        >
          <label htmlFor="place-label" className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
            Simpan jemputan ini 🏷️
          </label>
          <input
            id="place-label"
            type="text"
            value={placeLabel}
            onChange={(event) => setPlaceLabel(event.target.value)}
            placeholder={`Label, mis. "${pickup.label}"`}
            className="h-10 w-full flex-1 rounded-xl border-2 border-neutral-200 bg-white px-3.5 text-sm font-semibold text-neutral-900 transition-colors focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <Button size="sm" className="shrink-0" disabled={!pickupZoneId}>
            Simpan
          </Button>
        </form>
      )}
    </div>
  )
}