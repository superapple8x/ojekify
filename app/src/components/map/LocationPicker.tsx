import { useState } from 'react'
import type { SelectedPlace } from '../../api/types'
import { cn } from '../../lib/cn'
import { LocationPickerSheet } from './LocationPickerSheet'

export interface LocationPickerProps {
  value: SelectedPlace | null
  onChange: (place: SelectedPlace) => void
  placeholder?: string
  title?: string
  id?: string
  disabled?: boolean
}

export function LocationPicker({
  value,
  onChange,
  placeholder = 'Pilih lokasi…',
  title = 'Pilih lokasi',
  id,
  disabled = false,
}: LocationPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn(
          'relative flex h-12 w-full items-center rounded-xl border-2 bg-white px-4 pr-10 text-left text-sm font-semibold transition-colors focus:border-brand-500 focus:outline-none dark:bg-neutral-900',
          'border-neutral-200 dark:border-neutral-800',
          disabled && 'cursor-not-allowed opacity-50',
          !disabled && 'hover:border-neutral-300 dark:hover:border-neutral-700',
        )}
      >
        {value ? (
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span aria-hidden className="shrink-0 text-neutral-400">
              📍
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-neutral-900 dark:text-neutral-100">
                {value.label}
              </span>
              {value.detail && (
                <span className="block truncate text-xs font-normal text-neutral-500 dark:text-neutral-400">
                  {value.detail}
                </span>
              )}
            </span>
          </span>
        ) : (
          <span className="truncate text-neutral-400 dark:text-neutral-500">
            {placeholder}
          </span>
        )}
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-neutral-400"
        >
          ▾
        </span>
      </button>

      <LocationPickerSheet
        open={open}
        onClose={() => setOpen(false)}
        value={value}
        onChange={onChange}
        title={title}
      />
    </>
  )
}
