import { cn } from '../lib/cn'

export type ProviderAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface ProviderAvatarProps {
  name: string
  emoji?: string
  seed?: string
  size?: ProviderAvatarSize
  className?: string
}

const GRADIENTS = [
  'from-emerald-400 to-teal-600',
  'from-sky-400 to-indigo-600',
  'from-fuchsia-400 to-purple-600',
  'from-amber-300 to-orange-500',
  'from-rose-400 to-red-600',
  'from-lime-400 to-green-600',
  'from-cyan-400 to-blue-600',
  'from-violet-400 to-purple-700',
] as const

const sizeClasses: Record<ProviderAvatarSize, string> = {
  xs: 'size-8 text-[11px]',
  sm: 'size-10 text-xs',
  md: 'size-12 text-sm',
  lg: 'size-16 text-xl',
  xl: 'size-20 text-2xl',
}

function hashSeed(value: string): number {
  let hash = 0
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) % 997
  return hash
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

export function ProviderAvatar({
  name,
  emoji,
  seed,
  size = 'md',
  className,
}: ProviderAvatarProps) {
  const gradient = GRADIENTS[hashSeed(seed ?? name) % GRADIENTS.length]

  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        'grid shrink-0 select-none place-items-center rounded-full bg-gradient-to-br font-extrabold text-white shadow-md ring-2 ring-white/70 dark:ring-neutral-950',
        gradient,
        sizeClasses[size],
        className,
      )}
    >
      {emoji ?? initialsOf(name)}
    </span>
  )
}