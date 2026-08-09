import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type LeaderboardEntry, type Provider } from '../../api'
import {
  Button,
  Card,
  EmptyState,
  ProviderAvatar,
  SkeletonProviderRow,
  Tag,
  TierBadge,
  type TagVariant,
} from '../../components'
import { cn } from '../../lib/cn'

const RANK_STYLES: Record<number, { badge: string; tag: TagVariant; label: string }> = {
  1: {
    badge: 'bg-gradient-to-br from-amber-300 to-yellow-500 ring-amber-200 dark:ring-amber-400/40',
    tag: 'warning',
    label: 'Juara 1',
  },
  2: {
    badge: 'bg-gradient-to-br from-neutral-300 to-neutral-500 ring-neutral-200 dark:ring-neutral-400/40',
    tag: 'neutral',
    label: 'Juara 2',
  },
  3: {
    badge: 'bg-gradient-to-br from-orange-400 to-amber-600 ring-orange-200 dark:ring-orange-400/40',
    tag: 'info',
    label: 'Juara 3',
  },
}

const FALLBACK_RANK_STYLE = { badge: 'bg-neutral-300', tag: 'neutral', label: 'Top 3' }

function rankStyle(rank: number) {
  return RANK_STYLES[rank] ?? { ...FALLBACK_RANK_STYLE, label: `#${rank}` }
}

export function WallOfFame() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)
  const [providersById, setProvidersById] = useState<Record<string, Provider>>({})
  const [week, setWeek] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    setError(false)
    Promise.all([api.getLeaderboard(), api.getProviders(), api.getLeaderboardWeek()])
      .then(([leaderboard, providerList, weekLabel]) => {
        if (!alive) return
        setEntries(leaderboard)
        setProvidersById(Object.fromEntries(providerList.map((provider) => [provider.id, provider])))
        setWeek(weekLabel)
      })
      .catch(() => {
        if (alive) setError(true)
      })
    return () => {
      alive = false
    }
  }, [])

  if (error) {
    return (
      <EmptyState
        icon="📡"
        title="Wall of Fame gagal dimuat"
        description="Peringkat mingguan tidak bisa diambil sekarang. Coba lagi sebentar lagi."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError(false)
              setEntries(null)
            }}
          >
            Coba lagi
          </Button>
        }
      />
    )
  }

  if (!entries) {
    return (
      <div role="status" aria-label="Memuat Wall of Fame">
        <SkeletonProviderRow count={3} />
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon="🏆"
        title="Belum ada peringkat minggu ini"
        description="Peringkat akan muncul begitu ada cukup ulasan dari mahasiswa."
      />
    )
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-extrabold">
            <span aria-hidden>🏆</span> Wall of Fame
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Top 3 minggu ini — dihitung dari ulasan mahasiswa.
          </p>
        </div>
        {week && (
          <Tag variant="brand" className="shrink-0">
            {week}
          </Tag>
        )}
      </header>

      <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {entries.map((entry) => {
          const provider = providersById[entry.providerId]
          const style = rankStyle(entry.rank)
          return (
            <li
              key={entry.providerId}
              className={cn(
                'transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                entry.rank === 1 && 'bg-amber-50/70 dark:bg-amber-500/5',
              )}
            >
              <Link
                to={`/provider/${entry.providerId}`}
                className="flex items-center gap-3 px-4 py-3 sm:px-5"
              >
                <span
                  aria-label={style.label}
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br text-xs font-extrabold text-white shadow-sm ring-1',
                    style.badge,
                  )}
                >
                  #{entry.rank}
                </span>
                <ProviderAvatar
                  name={provider?.name ?? entry.providerId}
                  emoji={provider?.emoji}
                  seed={provider?.id ?? entry.providerId}
                  size="sm"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-extrabold">
                      {provider?.name ?? entry.providerId}
                    </span>
                    {provider && <TierBadge tier={provider.tier} />}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">
                    {entry.subtitle}
                  </span>
                </span>
                <Tag variant={style.tag} icon={<span aria-hidden>{entry.emoji}</span>} className="shrink-0">
                  {entry.title}
                </Tag>
              </Link>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
