import { useEffect, useMemo, useState } from 'react'
import { api, distanceKm } from '../../../api'
import type { Zone } from '../../../api'
import { formatKm } from '../../../lib/format'
import { cn } from '../../../lib/cn'
import { Button, Chip } from '../../../components'
import { useSavedPlaces } from '../../../hooks/useSavedPlaces'

export interface RouteStepProps {
  pickupZoneId: string
  dropoffZoneId: string
  onChange: (pickup: string, dropoff: string) => void
}

const selectClasses = [
  'h-12 w-full appearance-none rounded-xl border-2 border-neutral-200 bg-white px-4 text-sm font-semibold',
  'text-neutral-900 transition-colors focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100',
  'disabled:opacity-50',
].join(' ')

export function RouteStep({ pickupZoneId, dropoffZoneId, onChange }: RouteStepProps) {
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

  const groups = useMemo(() => {
    const kampus = zones.filter((zone) => zone.area === 'kampus')
    const luar = zones.filter((zone) => zone.area === 'luar')
    return [
      { label: 'Dalam Kampus', items: kampus },
      { label: 'Luar Kampus', items: luar },
    ]
  }, [zones])

  const bothChosen = Boolean(pickupZoneId && dropoffZoneId)
  const sameZone = bothChosen && pickupZoneId === dropoffZoneId
  const pickup = zones.find((zone) => zone.id === pickupZoneId)
  const dropoff = zones.find((zone) => zone.id === dropoffZoneId)

  return (
    <div className="space-y-5">
      {!bothChosen && (
        <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          Pilih zona jemput dan zona antar. Zona sudah dipetakan ke daftar tarif tiap provider,
          jadi tidak perlu ngetik alamat.
        </p>
      )}

      {bothChosen && !sameZone && pickup && dropoff && (
        <p className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          {pickup.emoji} {pickup.name} → {dropoff.emoji} {dropoff.name} ± {formatKm(distanceKm(pickup, dropoff))}
        </p>
      )}

      {sameZone && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300" role="alert">
          Zona jemput dan antar tidak boleh sama, pilih zona lain ya.
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
                  onClick={() => onChange(place.zoneId, dropoffZoneId)}
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
          <label htmlFor="pickup" className="text-sm font-semibold">Jemput dari</label>
          <div className="relative">
            <select
              id="pickup"
              value={pickupZoneId}
              onChange={(e) => onChange(e.target.value, dropoffZoneId)}
              className={cn(selectClasses, pickupZoneId === '' && 'text-neutral-400 dark:text-neutral-500')}
            >
              <option value="">Pilih zona…</option>
              {groups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.items.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.emoji} {zone.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-neutral-400">
              ▾
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="dropoff" className="text-sm font-semibold">Antar ke</label>
          <div className="relative">
            <select
              id="dropoff"
              value={dropoffZoneId}
              onChange={(e) => onChange(pickupZoneId, e.target.value)}
              className={cn(selectClasses, dropoffZoneId === '' && 'text-neutral-400 dark:text-neutral-400')}
            >
              <option value="">Pilih zona…</option>
              {groups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.items.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.emoji} {zone.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-neutral-400">
              ▾
            </span>
          </div>
        </div>
      </div>

      {bothChosen && !sameZone && (
        <button
          type="button"
          onClick={() => onChange(dropoffZoneId, pickupZoneId)}
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
            savePlace(placeLabel || pickup.name, pickup.id)
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
            placeholder={`Label, mis. "${pickup.name}"`}
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