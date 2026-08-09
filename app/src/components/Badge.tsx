import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export type BadgeTone = 'gray' | 'brand' | 'success' | 'warning' | 'danger'

const toneClasses: Record<BadgeTone, string> = {
  gray: 'bg-neutral-200/80 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  brand: 'bg-brand-500 text-white',
  success: 'bg-emerald-500 text-white',
  warning: 'bg-amber-400 text-amber-950',
  danger: 'bg-red-500 text-white',
}

export interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  dot?: boolean
  className?: string
}

export function Badge({ children, tone = 'gray', dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center gap-1 rounded-full px-1.5 text-[11px] font-bold leading-none',
        toneClasses[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  )
}