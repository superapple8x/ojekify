import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Provider } from '../api'
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ProviderAvatar,
  SkeletonProviderRow,
  StarRating,
  Tag,
  TierBadge,
  type TagVariant,
} from '../components'
import { formatIDR } from '../lib/format'
import {
  filterProviders,
  minFare,
  type ProviderSort,
  type TierFilter,
} from '../lib/providerSearch'

const TIER_FILTERS: { id: TierFilter; label: string; emoji: string }[] = [
  { id: 'all', label: 'Semua', emoji: '🗂️' },
  { id: 'legend', label: 'Kampus Legend', emoji: '🏆' },
  { id: 'verified', label: 'Verified', emoji: '✅' },
  { id: 'newbie', label: 'Newbie', emoji: '🌱' },
]

const RATING_FILTERS: { id: number | null; label: string }[] = [
  { id: null, label: 'Semua rating' },
  { id: 4.5, label: '⭐ 4.5+' },
  { id: 4.0, label: '⭐ 4.0+' },
]

const SORTS: { id: ProviderSort; label: string; emoji: string }[] = [
  { id: 'rating', label: 'Rating teratas', emoji: '⭐' },
  { id: 'response', label: 'Respon tercepat', emoji: '⚡' },
  { id: 'name', label: 'Nama A–Z', emoji: '🔤' },
]

function tagVariantForKind(kind: 'positive' | 'warning'): TagVariant {
  return kind === 'positive' ? 'success' : 'danger'
}

export default function Providers() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [tier, setTier] = useState<TierFilter>('all')
  const [minRating, setMinRating] = useState<number | null>(null)
  const [noHiddenOnly, setNoHiddenOnly] = useState(false)
  const [sort, setSort] = useState<ProviderSort>('rating')

  const load = () => {
    setLoading(true)
    setError(false)
    api
      .getProviders()
      .then((items) => {
        setProviders(items)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }

  useEffect(load, [])

  const tierCounts = useMemo(() => {
    const counts: Record<TierFilter, number> = {
      all: providers.length,
      newbie: 0,
      verified: 0,
      legend: 0,
    }
    for (const provider of providers) {
      counts[provider.tier] = (counts[provider.tier] ?? 0) + 1
    }
    return counts
  }, [providers])

  const visible = useMemo(
    () =>
      filterProviders(providers, {
        query,
        tier,
        minRating: minRating ?? 0,
        noHiddenFeesOnly: noHiddenOnly,
        sort,
      }),
    [providers, query, tier, minRating, noHiddenOnly, sort],
  )

  const hasFilters = query !== '' || tier !== 'all' || minRating !== null || noHiddenOnly

  const resetFilters = () => {
    setQuery('')
    setTier('all')
    setMinRating(null)
    setNoHiddenOnly(false)
  }

  if (loading) {
    return (
      <div className="animate-fade-in space-y-5" role="status" aria-label="Memuat daftar provider">
        <SkeletonProviderRow count={6} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <EmptyState
          icon="📡"
          title="Gagal memuat provider"
          description="Jaringan bermasalah atau server sedang sibuk. Coba muat ulang."
          action={
            <Button variant="outline" size="sm" onClick={load}>
              Muat ulang
            </Button>
          }
        />
      </div>
    )
  }

  if (providers.length === 0) {
    return (
      <div className="animate-fade-in">
        <EmptyState
          icon="🗺️"
          title="Belum ada provider"
          description="Daftar provider masih kosong — segera hadir."
          action={
            <Link to="/bandingkan">
              <Button variant="outline" size="sm">
                Bandingkan harga
              </Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Jelajah <span className="text-brand-500">Provider</span>
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Semua jek, print shop, dan jasa titipan kampus dalam satu direktori — cari dan
          filter sesukamu.
        </p>
      </header>

      <div className="relative">
        <span
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
          aria-hidden
        >
          🔍
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari nama, tagline, atau vibe tag…"
          aria-label="Cari provider"
          className="w-full rounded-full border border-neutral-200 bg-white py-2.5 pr-4 pl-10 text-sm font-medium shadow-sm transition-colors outline-none placeholder:text-neutral-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:placeholder:text-neutral-500"
        />
      </div>

      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
            Tier
          </span>
          {TIER_FILTERS.map((option) => (
            <Chip
              key={option.id}
              selected={tier === option.id}
              onClick={() => setTier(option.id)}
            >
              {option.emoji} {option.label} · {tierCounts[option.id]}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
            Rating
          </span>
          {RATING_FILTERS.map((option) => (
            <Chip
              key={String(option.id)}
              selected={minRating === option.id}
              onClick={() => setMinRating(option.id)}
            >
              {option.label}
            </Chip>
          ))}
          <Chip selected={noHiddenOnly} onClick={() => setNoHiddenOnly((value) => !value)}>
            🛡️ Tanpa biaya tersembunyi
          </Chip>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
          Urutkan
        </span>
        {SORTS.map((option) => (
          <Chip key={option.id} selected={sort === option.id} onClick={() => setSort(option.id)}>
            {option.emoji} {option.label}
          </Chip>
        ))}
      </div>

      <p
        className="text-xs font-semibold text-brand-600 tabular-nums dark:text-brand-400"
        aria-live="polite"
      >
        {visible.length} dari {providers.length} provider
      </p>

      {visible.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Tidak ada provider cocok"
          description="Coba kata kunci lain, atau longgarkan filter (misalnya rating) supaya hasilnya muncul."
          action={
            hasFilters ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset semua filter
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ol className="space-y-3" aria-label="Daftar provider">
          {visible.map((provider) => {
            const price = minFare(provider)
            return (
              <li key={provider.id}>
                <Link to={`/provider/${provider.id}`} className="block w-full text-left">
                  <Card interactive padding="sm">
                    <div className="flex items-center gap-3.5">
                      <ProviderAvatar
                        name={provider.name}
                        emoji={provider.emoji}
                        seed={provider.id}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h2 className="text-sm font-extrabold">{provider.name}</h2>
                          <TierBadge tier={provider.tier} />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                          {provider.tagline}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                          <StarRating value={provider.rating} size="sm" />
                          <span className="font-semibold tabular-nums">
                            {provider.rating.toFixed(1)}
                          </span>
                          <span>· {provider.reviews.toLocaleString('id-ID')} ulasan</span>
                          <span>· ±{provider.responseTimeMinutes} mnt</span>
                        </div>
                        {provider.tags.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {provider.tags.slice(0, 2).map((tag) => (
                              <Tag key={tag.id} variant={tagVariantForKind(tag.kind)}>
                                {tag.label}
                              </Tag>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-extrabold tracking-tight tabular-nums">
                          {price === null ? '—' : formatIDR(price)}
                        </p>
                        <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                          {price === null ? 'belum ada tarif' : 'mulai'}
                        </p>
                        <p
                          className={`mt-1 text-[11px] font-bold ${
                            provider.noHiddenFees
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {provider.noHiddenFees ? '🛡️ Tanpa cas tersembunyi' : '⚠️ Bisa ada tambahan'}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}