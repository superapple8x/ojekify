import type { ReactNode } from 'react'
import { Button, Card, Stepper } from '../../components'
import { cn } from '../../lib/cn'
import type { ComparatorStepIndex } from './types'

export interface StepShellProps<TStep extends number = ComparatorStepIndex> {
  steps: readonly string[]
  current: TStep
  enterable: TStep[]
  onStepClick: (index: TStep) => void
  title: string
  subtitle?: string
  children: ReactNode
  onBack?: () => void
  onContinue?: () => void
  continueDisabled?: boolean
  continueLabel?: string
  continueHint?: ReactNode
}

export function StepShell<TStep extends number = ComparatorStepIndex>({
  steps,
  current,
  enterable,
  onStepClick,
  title,
  subtitle,
  children,
  onBack,
  onContinue,
  continueDisabled = false,
  continueLabel = 'Lanjut',
  continueHint,
}: StepShellProps<TStep>) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Stepper
        steps={steps}
        current={current}
        onStepClick={(index) => {
          const target = index as TStep
          if (enterable.includes(target)) onStepClick(target)
        }}
        className="mb-8"
      />

      <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h1>
      {subtitle && (
        <p className="mt-1 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          {subtitle}
        </p>
      )}

      <Card className={cn('mt-5', onContinue ? 'pb-6' : '')}>{children}</Card>

      {continueHint && (
        <p
          className={cn(
            'mt-3 text-center text-xs text-neutral-500 dark:text-neutral-400',
            continueDisabled && 'font-semibold text-neutral-400 dark:text-neutral-500',
          )}
          aria-live="polite"
        >
          {continueHint}
        </p>
      )}

      {(onBack || onContinue) && (
        <div className="mt-5 flex items-center justify-between gap-3">
          {onBack && <Button variant="ghost" onClick={onBack}>Kembali</Button>}
          {onContinue && (
            <Button disabled={continueDisabled} onClick={onContinue} className="min-w-36">
              {continueLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}