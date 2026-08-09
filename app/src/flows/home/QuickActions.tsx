import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import type { ServiceMeta } from '../../api'
import { Button, Card, EmptyState, Skeleton } from '../../components'

export function QuickActions() {
  const [services, setServices] = useState<ServiceMeta[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    setError(false)
    api
      .getServices()
      .then((items) => alive && setServices(items))
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [])

  if (error) {
    return (
      <EmptyState
        icon="📡"
        title="Layanan gagal dimuat"
        description="Shortcut layanan tidak bisa diambil sekarang. Coba lagi sebentar lagi."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError(false)
              setServices(null)
            }}
          >
            Coba lagi
          </Button>
        }
      />
    )
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-extrabold">
            <span aria-hidden>⚡</span> Mau ngapain sekarang?
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Shortcut ke alur banding &amp; cetak — layanan favoritmu satu tap.
          </p>
        </div>
      </header>

      <div className="p-4 sm:p-5">
        {!services ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5" role="status" aria-label="Memuat layanan">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="card" className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {services.map((service) => (
              <Link
                key={service.id}
                to={service.id === 'print' ? '/cetak' : `/bandingkan?service=${service.id}`}
                className="group flex flex-col items-start gap-1.5 rounded-card border-2 border-transparent bg-white p-4 text-left shadow-card ring-1 ring-black/5 transition-all duration-200 outline-none hover:-translate-y-0.5 hover:border-brand-300 focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:bg-neutral-900 dark:ring-white/10 dark:hover:border-brand-500/50"
              >
                <span aria-hidden className="text-2xl transition-transform duration-200 group-hover:scale-110">
                  {service.emoji}
                </span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{service.label}</span>
                <span className="line-clamp-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {service.description}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}