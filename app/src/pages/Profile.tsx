import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Zone } from '../api'
import { Card, EmptyState } from '../components'
import { useSavedPlaces } from '../hooks/useSavedPlaces'

export default function Profile() {
  const { places, removePlace } = useSavedPlaces()
  const [zones, setZones] = useState<Zone[]>([])

  useEffect(() => {
    let alive = true
    void api.getZones().then((zoneItems) => {
      if (!alive) return
      setZones(zoneItems)
    })
    return () => {
      alive = false
    }
  }, [])

  const resolvePlace = (zoneId: string) => zones.find((zone) => zone.id === zoneId)

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-6">
      <header className="flex items-center gap-4">
        <span
          aria-hidden
          className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-2xl shadow-md shadow-brand-500/30"
        >
          🎓
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight">Profil kamu</h1>
          <p className="mt-0.5 truncate text-sm text-neutral-500 dark:text-neutral-400">
            Mahasiswa percontohan • Prodi Teknik • Mock (belum ada login)
          </p>
        </div>
      </header>

      <section aria-labelledby="saved-places-title">
        <h2 id="saved-places-title" className="mb-3 flex items-center gap-2 text-lg font-extrabold">
          <span aria-hidden>📍</span> Tempat tersimpan
        </h2>
        {places.length === 0 ? (
          <EmptyState
            icon="🏷️"
            title="Belum ada tempat tersimpan"
            description="Saat membandingkan harga, pilih zona jemput lalu simpan lewat form “Simpan jemputan ini”."
            action={
              <Link to="/bandingkan" className="rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-400">
                💸 Pilih rute dulu
              </Link>
            }
          />
        ) : (
          <Card padding="none" className="overflow-hidden">
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {places.map((place) => {
                const zone = resolvePlace(place.zoneId)
                return (
                  <li key={place.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <span className="text-xl" aria-hidden>
                      {zone?.emoji ?? '📍'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold">{place.label}</p>
                      <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                        {zone ? `${zone.name} • ${zone.area === 'kampus' ? 'dalam kampus' : 'luar kampus'}` : 'Zona dihapus dari katalog'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePlace(place.id)}
                      aria-label={`Hapus ${place.label}`}
                      className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-red-100 hover:text-red-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-red-500/20 dark:hover:text-red-400"
                    >
                      ✕
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}
        <p className="mt-3 text-[11px] text-neutral-400 dark:text-neutral-500">
          Tempat baru bisa disimpan dari wizard /bandingkan → langkah rute. Tersimpan lokal (mock).
        </p>
      </section>
    </div>
  )
}