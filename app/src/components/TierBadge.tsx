import { cn } from '../lib/cn'

export type ProviderTier = 'newbie' | 'verified' | 'legend'

const TIER_META: Record<ProviderTier, { label: string; icon: string; className: string }> = {
  newbie: {
    label: 'Newbie',
    icon: '🌱',
    className:
      'bg-neutral-100 text-neutral-600 ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700',
  },
  verified: {
    label: 'Verified',
    icon: '🛡️',
    className:
      'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30',
  },
  legend: {
    label: 'Kampus Legend',
    icon: '👑',
    className:
      'bg-amber-50 text-amber-700 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/40',
  },
}

export interface TierBadgeProps {
  tier: ProviderTier
  className?: string
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  const meta = TIER_META[tier]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1',
        meta.className,
        className,
      )}
    >
      <span aria-hidden>{meta.icon}</span>
      {meta.label}
    </span>
  )
}