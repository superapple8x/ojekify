import { useEffect, useState } from 'react'
import { CAMPUS_CENTER, ZONES_BY_ID } from '../api/zones'
import type { SelectedPlace } from '../api/types'
import { distanceMeters } from '../lib/geo'

export interface SavedPlace {
  id: string
  label: string
  detail?: string
  lat: number
  lng: number
  zoneId: string
}

export const DEFAULT_SAVED_PLACES: SavedPlace[] = [
  {
    id: 'saved-dorm',
    label: 'My Dorm',
    detail: 'Asrama (Dorm)',
    lat: -2.905,
    lng: 104.648,
    zoneId: 'asrama-putih',
  },
  {
    id: 'saved-fatek',
    label: 'Fakultas Teknik',
    detail: 'Fakultas Teknik',
    lat: -2.9148,
    lng: 104.6453,
    zoneId: 'fak-teknik',
  },
]

const STORAGE_KEY = 'pilihjek-saved-places'
const DEDUPE_METERS = 50

type RawSaved = Partial<SavedPlace> & { id: string; label: string; zoneId: string }

function hydrate(raw: RawSaved[]): SavedPlace[] {
  return raw.map((r) => {
    if (typeof r.lat === 'number' && typeof r.lng === 'number') {
      return r as SavedPlace
    }
    const zone = ZONES_BY_ID[r.zoneId]
    if (zone) {
      return {
        id: r.id,
        label: r.label,
        detail: r.detail ?? zone.name,
        lat: zone.lat,
        lng: zone.lng,
        zoneId: r.zoneId,
      }
    }
    return {
      id: r.id,
      label: r.label,
      detail: r.detail,
      lat: CAMPUS_CENTER.lat,
      lng: CAMPUS_CENTER.lng,
      zoneId: r.zoneId,
    }
  })
}

export function useSavedPlaces() {
  const [places, setPlaces] = useState<SavedPlace[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as RawSaved[]
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) return []
          return hydrate(parsed)
        }
      }
    } catch {
      // corrupted storage — fall through to defaults
    }
    return DEFAULT_SAVED_PLACES
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(places))
    } catch {
      // storage penuh / private mode — skip persist
    }
  }, [places])

  const savePlace = (label: string, place: SelectedPlace | string) => {
    const trimmed = label.trim()
    if (!trimmed) return

    let next: Omit<SavedPlace, 'id'> | null = null
    if (typeof place === 'string') {
      if (!place) return
      const zone = ZONES_BY_ID[place]
      if (!zone) return
      next = {
        label: trimmed,
        detail: zone.name,
        lat: zone.lat,
        lng: zone.lng,
        zoneId: place,
      }
    } else {
      if (!place.zoneId) return
      next = {
        label: trimmed,
        detail: place.detail,
        lat: place.lat,
        lng: place.lng,
        zoneId: place.zoneId,
      }
    }

    if (!next) return

    setPlaces((current) => {
      const dupIdx = current.findIndex((p) => distanceMeters(p, next) < DEDUPE_METERS)
      if (dupIdx >= 0) {
        return current.map((p, i) =>
          i === dupIdx
            ? {
                ...p,
                label: trimmed,
                detail: next.detail ?? p.detail,
                lat: next.lat,
                lng: next.lng,
                zoneId: next.zoneId,
              }
            : p,
        )
      }
      return [
        ...current,
        {
          id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ...next,
        },
      ]
    })
  }

  const removePlace = (id: string) => {
    setPlaces((current) => current.filter((place) => place.id !== id))
  }

  return { places, savePlace, removePlace }
}
