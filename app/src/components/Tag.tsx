import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export type TagVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'

const variantClasses: Record<TagVariant, string> = {
  neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  info: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
}

export interface TagProps {
  children: ReactNode
  variant?: TagVariant
  icon?: ReactNode
  className?: string
}

export function Tag({ children, variant = 'neutral', icon, className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
        variantClasses[variant],
        className,
      )}
    >
      {icon && <span className="shrink-0" aria-hidden>{icon}</span>}
      {children}
    </span>
  )
}