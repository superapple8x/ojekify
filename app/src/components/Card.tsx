import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  selected?: boolean
  padding?: CardPadding
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6 sm:p-7',
}

export function Card({
  interactive = false,
  selected = false,
  padding = 'md',
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card bg-white shadow-card ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10',
        interactive && 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop',
        selected && 'ring-2 ring-brand-500 dark:ring-brand-400',
        paddingClasses[padding],
        className,
      )}
      {...rest}
    />
  )
}