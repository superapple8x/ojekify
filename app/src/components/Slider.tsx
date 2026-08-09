import { useId, type ReactNode } from 'react'
import { cn } from '../lib/cn'

export interface SliderProps {
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  label?: ReactNode
  format?: (value: number) => string
  disabled?: boolean
  className?: string
}

export function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  format,
  disabled = false,
  className,
}: SliderProps) {
  const id = useId()
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className={cn('w-full', disabled && 'opacity-50', className)}>
      {(label || format) && (
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          {label && (
            <label htmlFor={id} className="text-sm font-semibold">
              {label}
            </label>
          )}
          {format && (
            <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-700 tabular-nums dark:bg-brand-500/15 dark:text-brand-300">
              {format(value)}
            </span>
          )}
        </div>
      )}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={typeof label === 'string' ? label : undefined}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          'h-2 w-full cursor-pointer rounded-full transition-opacity',
          'appearance-none bg-transparent',
          '[&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:ring-2',
          '[&::-webkit-slider-thumb]:ring-brand-500 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110',
          '[&::-webkit-slider-thumb]:active:scale-95',
          '[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0',
          '[&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md',
          disabled && '[&::-webkit-slider-thumb]:ring-neutral-400 [&::-moz-range-thumb]:ring-2 [&::-moz-range-thumb]:ring-neutral-400',
          className,
        )}
        style={{
          backgroundImage: `linear-gradient(90deg, var(--color-brand-500) ${pct}%, var(--slider-track) ${pct}%)`,
        }}
      />
    </div>
  )
}