import type { LeaderboardEntry, ProviderReview, VibeTagCount } from './types'

export const LEADERBOARD_WEEK = 'Minggu ke-2 • Agustus 2026'

export const LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    providerId: 'kuy-jek',
    title: 'Best Overall',
    subtitle: 'Rating tertinggi minggu ini',
    emoji: '🏆',
  },
  {
    rank: 2,
    providerId: 'jek-ngebut',
    title: 'Fastest Deliveries',
    subtitle: 'Respon tercepat: ±3 menit',
    emoji: '⚡',
  },
  {
    rank: 3,
    providerId: 'print-kuy',
    title: 'Document Printing',
    subtitle: 'Rating cetak tertinggi',
    emoji: '🖨️',
  },
]

const tag = (
  id: string,
  label: string,
  kind: 'positive' | 'warning',
  count: number,
): VibeTagCount => ({ id, label, kind, count })

export const REVIEWS: ProviderReview[] = [
  {
    providerId: 'kuy-jek',
    score: 4.8,
    pillars: { speed: 4.7, itemSafety: 4.8, priceHonesty: 4.9 },
    totalRatings: 842,
    positiveTags: [
      tag('penyelamat-skripsi', 'Penyelamat Skripsi', 'positive', 120),
      tag('admin-fast', 'Admin Fast Respon', 'positive', 98),
      tag('anti-nyasar', 'Anti-Nyasar', 'positive', 76),
    ],
    warningTags: [tag('sering-telat', 'Sering Telat', 'warning', 22)],
    ghostReportsWeek: 1,
  },
  {
    providerId: 'jek-ngebut',
    score: 4.9,
    pillars: { speed: 5.0, itemSafety: 4.7, priceHonesty: 4.8 },
    totalRatings: 361,
    positiveTags: [
      tag('admin-fast', 'Admin Fast Respon', 'positive', 64),
      tag('anti-nyasar', 'Anti-Nyasar', 'positive', 52),
    ],
    warningTags: [tag('suka-minta', 'Suka Minta Tambahan', 'warning', 9)],
    ghostReportsWeek: 2,
  },
  {
    providerId: 'kampus-jek',
    score: 4.2,
    pillars: { speed: 4.1, itemSafety: 4.3, priceHonesty: 3.9 },
    totalRatings: 1200,
    positiveTags: [tag('amanah-topup', 'Amanah Top-Up', 'positive', 300)],
    warningTags: [
      tag('suka-minta', 'Suka Minta Tambahan', 'warning', 240),
      tag('admin-jutek', 'Admin Jutek', 'warning', 218),
      tag('sering-telat', 'Sering Telat', 'warning', 130),
    ],
    ghostReportsWeek: 9,
  },
  {
    providerId: 'print-kuy',
    score: 4.6,
    pillars: { speed: 4.5, itemSafety: 4.8, priceHonesty: 4.6 },
    totalRatings: 287,
    positiveTags: [
      tag('penyelamat-skripsi', 'Penyelamat Skripsi', 'positive', 260),
      tag('admin-fast', 'Admin Fast Respon', 'positive', 88),
    ],
    warningTags: [tag('sering-telat', 'Sering Telat', 'warning', 44)],
    ghostReportsWeek: 2,
  },
  {
    providerId: 'bunda-jek',
    score: 4.6,
    pillars: { speed: 4.4, itemSafety: 4.7, priceHonesty: 4.8 },
    totalRatings: 512,
    positiveTags: [
      tag('amanah-topup', 'Amanah Top-Up', 'positive', 180),
      tag('anti-nyasar', 'Anti-Nyasar', 'positive', 120),
    ],
    warningTags: [tag('admin-jutek', 'Admin Jutek', 'warning', 36)],
    ghostReportsWeek: 1,
  },
  {
    providerId: 'mitra-jek',
    score: 4.1,
    pillars: { speed: 4.0, itemSafety: 4.2, priceHonesty: 3.8 },
    totalRatings: 47,
    positiveTags: [tag('admin-fast', 'Admin Fast Respon', 'positive', 25)],
    warningTags: [
      tag('suka-minta', 'Suka Minta Tambahan', 'warning', 15),
      tag('sering-telat', 'Sering Telat', 'warning', 12),
    ],
    ghostReportsWeek: 3,
  },
]

export const REVIEWS_BY_PROVIDER: Record<string, ProviderReview> = Object.fromEntries(
  REVIEWS.map((review) => [review.providerId, review]),
)