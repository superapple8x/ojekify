import { cn } from '../lib/cn'

export type SkeletonVariant = 'rect' | 'circle' | 'card'

export interface SkeletonProps {
  variant?: SkeletonVariant
  className?: string
}

export function Skeleton({ variant = 'rect', className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'animate-pulse bg-neutral-200 dark:bg-neutral-800',
        variant === 'rect' && 'rounded-lg',
        variant === 'circle' && 'rounded-full',
        variant === 'card' && 'rounded-card',
        className,
      )}
    />
  )
}

export interface SkeletonLinesProps {
  lines?: number
  className?: string
}

export function SkeletonLines({ lines = 3, className }: SkeletonLinesProps) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3.5', i === lines - 1 && lines > 1 && 'w-3/4', className)}
        />
      ))}
    </div>
  )
}

export interface SkeletonProviderRowProps {
  count?: number
  className?: string
}

export function SkeletonProviderRow({ count = 3, className }: SkeletonProviderRowProps) {
  return (
    <div className={cn('space-y-3', className)} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-card border border-neutral-200/70 bg-white p-4 shadow-card dark:border-neutral-800 dark:bg-neutral-900"
        >
          <Skeleton variant="circle" className="size-12 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3.5 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  )
}