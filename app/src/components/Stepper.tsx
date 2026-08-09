import { Fragment } from 'react'
import { cn } from '../lib/cn'

export interface StepperProps {
  steps: readonly string[]
  current: number
  onStepClick?: (index: number) => void
  className?: string
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.8a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function Stepper({ steps, current, onStepClick, className }: StepperProps) {
  return (
    <ol className={cn('flex items-center', className)}>
      {steps.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'upcoming'
        const clickable = Boolean(onStepClick) && i <= current

        const circle = (
          <span
            className={cn(
              'grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors',
              state === 'done' && 'bg-brand-500 text-white',
              state === 'current' &&
                'bg-brand-50 text-brand-600 ring-2 ring-brand-500 dark:bg-brand-500/15 dark:text-brand-300',
              state === 'upcoming' && 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600',
            )}
          >
            {state === 'done' ? <CheckIcon className="size-3.5" /> : i + 1}
          </span>
        )

        const text = (
          <span
            className={cn(
              'hidden max-w-24 truncate text-xs font-semibold sm:inline',
              state === 'upcoming' ? 'text-neutral-400 dark:text-neutral-600' : 'text-neutral-800 dark:text-neutral-200',
            )}
          >
            {label}
          </span>
        )

        return (
          <Fragment key={label}>
            {i > 0 && (
              <li
                aria-hidden
                className={cn(
                  'mx-1.5 h-0.5 min-w-3 flex-1 rounded-full',
                  state === 'done' || state === 'current'
                    ? 'bg-brand-300 dark:bg-brand-600'
                    : 'bg-neutral-200 dark:bg-neutral-800',
                )}
              />
            )}
            <li>
              {onStepClick ? (
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => onStepClick(i)}
                  className={cn('flex items-center gap-1.5', clickable ? 'cursor-pointer' : 'cursor-default')}
                  aria-current={state === 'current' ? 'step' : undefined}
                >
                  {circle}
                  {text}
                </button>
              ) : (
                <span className="flex items-center gap-1.5" aria-current={state === 'current' ? 'step' : undefined}>
                  {circle}
                  {text}
                </span>
              )}
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}