import { useEffect, useState } from 'react'
import { api } from '../../../api'
import type { ServiceMeta, ServiceId } from '../../../api'
import { EmptyState, Skeleton } from '../../../components'
import { cn } from '../../../lib/cn'

export interface ServiceStepProps {
  selected: ServiceId | null
  onSelect: (service: ServiceId) => void
}

export function ServiceStep({ selected, onSelect }: ServiceStepProps) {
  const [services, setServices] = useState<ServiceMeta[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    api
      .getServices()
      .then((items) => alive && setServices(items))
      .catch(() => alive && setError(true))
    return () => {
      alive = false
    }
  }, [])

  return (
    <div>
      {error && (
        <EmptyState
          icon="📡"
          title="Gagal memuat layanan"
          description="Cek koneksi atau coba lagi sebentar."
        />
      )}

      {!error && !services && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="card" className="h-28" />
          ))}
        </div>
      )}

      {services && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Pilih layanan">
          {services.map((service) => {
            const isSelected = selected === service.id
            return (
              <button
                key={service.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelect(service.id)}
                className={cn(
                  'flex flex-col items-start gap-1.5 rounded-card p-4 text-left transition-all duration-200',
                  'border-2 bg-white shadow-card dark:bg-neutral-900',
                  isSelected
                    ? 'border-brand-500 ring-2 ring-brand-500/25'
                    : 'border-transparent ring-1 ring-black/5 hover:-translate-y-0.5 hover:border-brand-300 dark:ring-white/10 dark:hover:border-brand-500/50',
                )}
              >
                <span aria-hidden className="text-2xl">
                  {service.emoji}
                </span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{service.label}</span>
                <span className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {service.description}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}