import type { Provider, ProviderTier } from '../api'

export type ProviderSort = 'rating' | 'response' | 'name'

export type TierFilter = 'all' | ProviderTier

export interface ProviderSearchOptions {
  query?: string
  tier?: TierFilter
  minRating?: number
  noHiddenFeesOnly?: boolean
  sort?: ProviderSort
}

export const TIER_LABELS: Record<ProviderTier, string> = {
  newbie: 'Newbie',
  verified: 'Verified',
  legend: 'Kampus Legend',
}

export function minFare(provider: Provider): number | null {
  let lowest: number | null = null
  for (const bands of Object.values(provider.fares)) {
    for (const band of bands) {
      if (lowest === null || band.price < lowest) lowest = band.price
    }
  }
  return lowest
}

export function filterProviders(
  providers: Provider[],
  options: ProviderSearchOptions,
): Provider[] {
  const query = options.query?.trim().toLowerCase() ?? ''
  const tier = options.tier ?? 'all'
  const minRating = options.minRating ?? 0
  const noHiddenFeesOnly = options.noHiddenFeesOnly ?? false
  const sort = options.sort ?? 'rating'

  const result = providers.filter((provider) => {
    if (tier !== 'all' && provider.tier !== tier) return false
    if (provider.rating < minRating) return false
    if (noHiddenFeesOnly && !provider.noHiddenFees) return false
    if (query) {
      const haystack = [
        provider.name,
        provider.tagline,
        ...provider.tags.map((tag) => tag.label),
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(query)) return false
    }
    return true
  })

  const byRating = (a: Provider, b: Provider) =>
    b.rating - a.rating || a.name.localeCompare(b.name)

  switch (sort) {
    case 'response':
      return [...result].sort(
        (a, b) => a.responseTimeMinutes - b.responseTimeMinutes || byRating(a, b),
      )
    case 'name':
      return [...result].sort((a, b) => a.name.localeCompare(b.name))
    case 'rating':
    default:
      return [...result].sort(byRating)
  }
}