import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export interface EmptyStateProps {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-neutral-200 bg-white/50 px-6 py-12 text-center dark:border-neutral-800 dark:bg-neutral-900/40',
        className,
      )}
    >
      {icon && (
        <div className="grid size-14 place-items-center rounded-full bg-brand-50 text-2xl dark:bg-brand-500/10" aria-hidden>
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm font-bold text-neutral-900 dark:text-white">{title}</p>
        {description && (
          <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}