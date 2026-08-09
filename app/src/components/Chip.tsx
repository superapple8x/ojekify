import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export interface ChipProps {
  children: ReactNode
  selected?: boolean
  onClick?: () => void
  onRemove?: () => void
  icon?: ReactNode
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-8 gap-1 px-2.5 text-xs',
  md: 'h-9 gap-1.5 px-3.5 text-[13px]',
} as const

export function Chip({
  children,
  selected = false,
  onClick,
  onRemove,
  icon,
  size = 'md',
  disabled = false,
  className,
}: ChipProps) {
  const look = cn(
    'inline-flex items-center rounded-full border font-semibold whitespace-nowrap transition-all duration-200',
    sizeClasses[size],
    selected
      ? 'border-brand-500 bg-brand-500 text-white shadow-sm shadow-brand-500/25'
      : 'border-neutral-200 bg-white text-neutral-700 hover:border-brand-300 hover:text-brand-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-brand-500/50 dark:hover:text-brand-300',
    onClick && !disabled && 'cursor-pointer active:scale-95',
    disabled && 'pointer-events-none opacity-50',
    className,
  )

  const content = (
    <>
      {icon && <span className="shrink-0" aria-hidden>{icon}</span>}
      <span className="min-w-0 truncate">{children}</span>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${typeof children === 'string' ? children : 'item'}`}
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className={cn(
            '-mr-0.5 grid size-4.5 shrink-0 place-items-center rounded-full transition-colors',
            selected
              ? 'bg-white/20 text-white hover:bg-white/30'
              : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700',
          )}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="size-3" aria-hidden>
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
            />
          </svg>
        </button>
      )}
    </>
  )

  if (onClick) {
    return (
      <button type="button" className={look} onClick={onClick} disabled={disabled} aria-pressed={selected}>
        {content}
      </button>
    )
  }
  return <span className={look}>{content}</span>
}