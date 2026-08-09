import { useId, type ReactNode } from 'react'
import { cn } from '../lib/cn'

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  description?: ReactNode
  disabled?: boolean
  className?: string
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}: ToggleProps) {
  const id = useId()

  return (
    <label
      htmlFor={id}
      className={cn('flex items-center justify-between gap-4', disabled && 'opacity-50', className)}
    >
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-semibold">{label}</span>}
          {description && (
            <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
              {description}
            </span>
          )}
        </span>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={typeof label === 'string' ? label : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 disabled:pointer-events-none',
          checked
            ? 'bg-brand-500'
            : 'bg-neutral-200 dark:bg-neutral-700',
          className,
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 size-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-all duration-200',
            checked ? 'left-6' : 'left-0.5',
          )}
        />
      </button>
    </label>
  )
}