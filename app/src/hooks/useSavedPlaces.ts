import { useEffect, useState } from 'react'

export interface SavedPlace {
  id: string
  label: string
  zoneId: string
}

export const DEFAULT_SAVED_PLACES: SavedPlace[] = [
  { id: 'saved-dorm', label: 'My Dorm', zoneId: 'asrama-putih' },
  { id: 'saved-fatek', label: 'Fakultas Teknik', zoneId: 'fak-teknik' },
]

const STORAGE_KEY = 'pilihjek-saved-places'

export function useSavedPlaces() {
  const [places, setPlaces] = useState<SavedPlace[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw) as SavedPlace[]
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

  const savePlace = (label: string, zoneId: string) => {
    const trimmed = label.trim()
    if (!trimmed || !zoneId) return
    setPlaces((current) => {
      const existing = current.find((place) => place.zoneId === zoneId)
      if (existing) {
        return current.map((place) =>
          place.zoneId === zoneId ? { ...place, label: trimmed } : place,
        )
      }
      return [...current, { id: `saved-${Date.now()}`, label: trimmed, zoneId }]
    })
  }

  const removePlace = (id: string) => {
    setPlaces((current) => current.filter((place) => place.id !== id))
  }

  return { places, savePlace, removePlace }
}