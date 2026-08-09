import type {
  ApiClient,
  AppNotification,
  ComparisonResult,
  DisputeReport,
  DisputeSubmissionInput,
  DueReviewHook,
  KampusKoinEntry,
  KampusKoinState,
  LeaderboardEntry,
  OrderItem,
  OrderStatus,
  PdfDescriptor,
  PlaceOrderInput,
  Provider,
  ProviderReview,
  Quote,
  QuoteRequest,
  ReviewSubmission,
  ReviewSubmissionInput,
  ServiceMeta,
  Zone,
} from './types'
import { PROVIDERS, SERVICES } from './providers'
import { ZONES } from './zones'
import { compareQuotes, computeQuote } from './priceEngine'
import { LEADERBOARD, LEADERBOARD_WEEK, REVIEWS } from './reviews'
import { mockPdfPageCount, mockPrintFileLink } from './print'

export type {
  ApiClient,
  AppNotification,
  BindingId,
  CasRules,
  ComparisonResult,
  ComparisonRow,
  DisputeKind,
  DisputeReport,
  DisputeSubmissionInput,
  DueReviewHook,
  ErrandKind,
  FareBand,
  ItemCas,
  KampusKoinEntry,
  KampusKoinKind,
  KampusKoinState,
  LeaderboardEntry,
  NightCas,
  NotificationKind,
  OrderItem,
  OrderStatus,
  PaperSizeId,
  PaperWeightId,
  PaymentMethod,
  PdfDescriptor,
  PlaceOrderInput,
  PriceConditions,
  PrintColorMode,
  Provider,
  ProviderReview,
  ProviderTier,
  Quote,
  QuoteRequest,
  ReceiptLine,
  ResultTag,
  ReviewPillars,
  ReviewSubmission,
  ReviewSubmissionInput,
  PriceHonestyRating,
  ItemSafetyRating,
  SpeedRating,
  ServiceExtras,
  ServiceId,
  ServiceMeta,
  TopupTier,
  VibeTag,
  VibeTagCount,
  VibeTagKind,
  WaFieldId,
  WaTemplate,
  Zone,
  ZoneArea,
} from './types'
export { ZONES, ZONES_BY_ID, getZone } from './zones'
export { PROVIDERS, PROVIDERS_BY_ID, SERVICES, ERRAND_KINDS, VIBE_TAGS } from './providers'
export { computeQuote, compareQuotes, distanceKm, getQuote } from './priceEngine'
export { REVIEWS, REVIEWS_BY_PROVIDER, LEADERBOARD, LEADERBOARD_WEEK } from './reviews'
export { BINDINGS, BINDINGS_BY_ID, COLOR_MODES, DEFAULT_PRINT_DRAFT, PAPER_SIZES, PAPER_WEIGHTS, PRINT_PARTNER, PRINT_RATES, estimatePrintDeliveryFee, estimatePrintJob, mockPrintFileLink } from './print'
export type { PrintDeliveryEstimate, PrintJobEstimate } from './print'

const latencyMs = () => 80 + Math.round(Math.random() * 220)

function simulateNetwork<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(value)), latencyMs())
  })
}

/**
 * Swap point: ganti instance `api` di bawah dengan client backend nyata
 * yang mengimplementasikan interface `ApiClient`. Tidak ada komponen lain
 * yang boleh import data mock secara langsung.
 */

const ORDERS_KEY = 'pilihjek-orders'
const NOTIFICATIONS_KEY = 'pilihjek-notifications'
const REVIEWS_KEY = 'pilihjek-reviews'
const KOIN_KEY = 'pilihjek-koin'
const DISPUTES_KEY = 'pilihjek-disputes'

// Ulasan jujur = +50 KampusKoin (review.txt §6).
export const REVIEW_KOIN_REWARD = 50
// Saldo awal mock: bonus daftar + review pertama (seed 1×, seperti saved-places).
const KOIN_SEED: KampusKoinState = {
  balance: 128,
  entries: [
    {
      id: 'KOIN-SEED-2',
      kind: 'earn',
      amount: 78,
      reason: 'review',
      note: 'Ulasan pertama — Kuy Jek ⭐',
      at: Date.now() - 4 * 24 * 60 * 60 * 1000,
    },
    {
      id: 'KOIN-SEED-1',
      kind: 'earn',
      amount: 50,
      reason: 'signup',
      note: 'Bonus daftar PilihJek 🎉',
      at: Date.now() - 6 * 24 * 60 * 60 * 1000,
    },
  ],
}

// Review hook: 45 menit setelah order, mock "push" menawarkan review (+50 KampusKoin).
const REVIEW_HOOK_MS = 45 * 60 * 1000

// Seed demo orders 1× (pola KOIN_SEED): halaman /pesanan langsung bisa diperagakan
// dengan beragam status, dan tetap aman karena flag terpisah dari data order.
const ORDERS_SEEDED_KEY = 'pilihjek-orders-seeded'

function seedOrdersOnce(): OrderItem[] {
  const seeded = localStorage.getItem(ORDERS_SEEDED_KEY)
  if (seeded) return readStore<OrderItem[]>(ORDERS_KEY, [])
  const HOUR = 60 * 60 * 1000
  const DAY = 24 * HOUR
  const now = Date.now()
  const demo: OrderItem[] = [
    {
      id: 'OPS-DEMO-1',
      createdAt: now - 2 * HOUR,
      status: 'selesai',
      providerId: 'kuy-jek',
      providerName: 'Kuy Jek',
      providerEmoji: '🛺',
      serviceLabel: 'Food Delivery',
      pickupName: 'Kantin Biru',
      dropoffName: 'Asrama Putra',
      total: 19000,
      waUrl: 'https://wa.me/6281234567890?text=Order-DEMO-1',
      reviewPendingAt: null,
    },
    {
      id: 'OPS-DEMO-2',
      createdAt: now - 9 * HOUR,
      status: 'proses',
      providerId: 'kampus-jek',
      providerName: 'KampusJek',
      providerEmoji: '🏫',
      serviceLabel: 'Ride',
      pickupName: 'Gerbang Utama',
      dropoffName: 'Fakultas Teknik',
      total: 11000,
      waUrl: 'https://wa.me/6289876543210?text=Order-DEMO-2',
      reviewPendingAt: null,
    },
    {
      id: 'OPS-DEMO-3',
      createdAt: now - 3 * DAY - 4 * HOUR,
      status: 'dibatalkan',
      providerId: 'print-kuy',
      providerName: 'PrintKuy',
      providerEmoji: '🖨️',
      serviceLabel: 'Print & Antar',
      pickupName: 'Fotokopian Campus',
      dropoffName: 'Perpustakaan Pusat',
      total: 23500,
      waUrl: 'https://wa.me/6285551234567?text=Order-DEMO-3',
      reviewPendingAt: null,
    },
  ]
  writeStore(ORDERS_KEY, demo)
  try {
    localStorage.setItem(ORDERS_SEEDED_KEY, '1')
  } catch {
    // private mode — seed boleh terulang
  }
  return demo
}

function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStore<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage penuh / private mode — pretend it worked
  }
}

export class MockApiClient implements ApiClient {
  getServices(): Promise<ServiceMeta[]> {
    return simulateNetwork(SERVICES)
  }

  getZones(): Promise<Zone[]> {
    return simulateNetwork(ZONES)
  }

  getProviders(): Promise<Provider[]> {
    return simulateNetwork(PROVIDERS)
  }

  getProvider(id: string): Promise<Provider | undefined> {
    return simulateNetwork(PROVIDERS.find((provider) => provider.id === id))
  }

  getReviews(): Promise<ProviderReview[]> {
    return simulateNetwork(REVIEWS)
  }

  getReview(providerId: string): Promise<ProviderReview | undefined> {
    return simulateNetwork(REVIEWS.find((review) => review.providerId === providerId))
  }

  getLeaderboard(): Promise<LeaderboardEntry[]> {
    return simulateNetwork(LEADERBOARD)
  }

  getLeaderboardWeek(): Promise<string> {
    return simulateNetwork(LEADERBOARD_WEEK)
  }

  submitReview(input: ReviewSubmissionInput): Promise<ReviewSubmission> {
    const submission: ReviewSubmission = {
      id: `RVT-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      createdAt: Date.now(),
      ...input,
    }
    writeStore(REVIEWS_KEY, [...readStore<ReviewSubmission[]>(REVIEWS_KEY, []), submission])
    const koin = this.addKoin({
      kind: 'earn',
      amount: REVIEW_KOIN_REWARD,
      reason: 'review',
      note: `Ulasan ${input.providerName} ${input.providerEmoji} — +${REVIEW_KOIN_REWARD} KampusKoin`,
    })
    const notification: AppNotification = {
      id: `NOT-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      kind: 'koin-earned',
      title: `+${REVIEW_KOIN_REWARD} KampusKoin 🪙`,
      body: `Ulasan ${input.providerName} terkirim — saldo kamu sekarang ${koin.balance}.`,
      at: Date.now(),
      read: false,
    }
    writeStore(NOTIFICATIONS_KEY, [
      ...readStore<AppNotification[]>(NOTIFICATIONS_KEY, []),
      notification,
    ])
    return simulateNetwork(submission)
  }

  reportDispute(input: DisputeSubmissionInput): Promise<DisputeReport> {
    const report: DisputeReport = {
      id: `DSP-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      providerId: input.providerId,
      kind: input.kind,
      at: Date.now(),
    }
    writeStore(DISPUTES_KEY, [...readStore<DisputeReport[]>(DISPUTES_KEY, []), report])
    const notification: AppNotification = {
      id: `NOT-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      kind: 'dispute-logged',
      title: 'Laporan diterima 📮',
      body: `Kami catat: ${input.providerName} ${input.providerEmoji} — skor keandalannya diturunkan sementara.`,
      at: Date.now(),
      read: false,
    }
    writeStore(NOTIFICATIONS_KEY, [
      ...readStore<AppNotification[]>(NOTIFICATIONS_KEY, []),
      notification,
    ])
    return simulateNetwork(report)
  }

  getDisputes(): Promise<DisputeReport[]> {
    return simulateNetwork(readStore<DisputeReport[]>(DISPUTES_KEY, []))
  }

  getKampusKoin(): Promise<KampusKoinState> {
    return simulateNetwork(this.getKampusKoinStateSync())
  }

  getQuote(providerId: string, request: QuoteRequest): Promise<Quote | undefined> {
    const provider = PROVIDERS.find((candidate) => candidate.id === providerId)
    if (!provider) return simulateNetwork(undefined)
    return simulateNetwork(computeQuote(provider, request))
  }

  compareQuote(request: QuoteRequest): Promise<ComparisonResult> {
    return simulateNetwork(compareQuotes(PROVIDERS, request))
  }

  countPdfPages(pdf: PdfDescriptor): Promise<number> {
    return simulateNetwork(mockPdfPageCount(pdf))
  }

  getPrintFileLink(pdf: PdfDescriptor): Promise<string> {
    return simulateNetwork(mockPrintFileLink(pdf))
  }

  placeOrder(input: PlaceOrderInput): Promise<OrderItem> {
    const order: OrderItem = {
      id: `OPS-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      createdAt: Date.now(),
      status: 'pending',
      ...input,
      reviewPendingAt: Date.now() + REVIEW_HOOK_MS,
    }
    writeStore(ORDERS_KEY, [...readStore<OrderItem[]>(ORDERS_KEY, []), order])
    const notification: AppNotification = {
      id: `NOT-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      kind: 'order-confirmed',
      title: 'Order via WhatsApp tercatat 📦',
      body: `${order.serviceLabel}: ${order.pickupName} → ${order.dropoffName} • ${order.providerName}`,
      at: order.createdAt,
      read: false,
    }
    writeStore(NOTIFICATIONS_KEY, [
      ...readStore<AppNotification[]>(NOTIFICATIONS_KEY, []),
      notification,
    ])
    return simulateNetwork(order)
  }

  getOrders(): Promise<OrderItem[]> {
    return simulateNetwork(seedOrdersOnce())
  }

  updateOrderStatus(orderId: string, next: OrderStatus): Promise<OrderItem | undefined> {
    const orders = readStore<OrderItem[]>(ORDERS_KEY, [])
    const order = orders.find((candidate) => candidate.id === orderId)
    if (!order) return simulateNetwork(undefined)
    const ALLOWED_NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
      pending: ['selesai', 'dibatalkan'],
      proses: ['selesai', 'dibatalkan'],
    }
    if (!ALLOWED_NEXT[order.status]?.includes(next)) return simulateNetwork(undefined)
    const updated: OrderItem = { ...order, status: next }
    writeStore(
      ORDERS_KEY,
      orders.map((candidate) => (candidate.id === orderId ? updated : candidate)),
    )
    return simulateNetwork(updated)
  }

  getNotifications(): Promise<AppNotification[]> {
    return simulateNetwork(readStore<AppNotification[]>(NOTIFICATIONS_KEY, []))
  }

  markNotificationsRead(): Promise<void> {
    const all = readStore<AppNotification[]>(NOTIFICATIONS_KEY, []).map((notification) => ({
      ...notification,
      read: true,
    }))
    writeStore(NOTIFICATIONS_KEY, all)
    return simulateNetwork(undefined)
  }

  getDueReviewHooks(now: number): Promise<DueReviewHook[]> {
    const hooks: DueReviewHook[] = readStore<OrderItem[]>(ORDERS_KEY, [])
      .filter((order) => order.reviewPendingAt !== null && order.reviewPendingAt <= now)
      .map((order) => ({
        orderId: order.id,
        providerId: order.providerId,
        providerName: order.providerName,
        providerEmoji: order.providerEmoji,
        total: order.total,
      }))
    return simulateNetwork(hooks)
  }

  deliverReviewHook(orderId: string): Promise<AppNotification> {
    const orders = readStore<OrderItem[]>(ORDERS_KEY, [])
    const order = orders.find((candidate) => candidate.id === orderId)
    if (!order) throw new Error(`Order tidak ditemukan: ${orderId}`)
    writeStore(
      ORDERS_KEY,
      orders.map((candidate) =>
        candidate.id === orderId ? { ...candidate, reviewPendingAt: null } : candidate,
      ),
    )
    const notification: AppNotification = {
      id: `NOT-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      kind: 'review-hook',
      title: `Review ${order.providerName}? ⭐`,
      body: `Did ${order.providerName} save the day? Nilai sekarang, +50 KampusKoin.`,
      at: Date.now(),
      read: false,
    }
    writeStore(NOTIFICATIONS_KEY, [
      ...readStore<AppNotification[]>(NOTIFICATIONS_KEY, []),
      notification,
    ])
    return simulateNetwork(notification)
  }

  private addKoin(input: Omit<KampusKoinEntry, 'id' | 'at'>): KampusKoinState {
    const current = this.getKampusKoinStateSync()
    const entry: KampusKoinEntry = {
      id: `KOIN-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      at: Date.now(),
      ...input,
    }
    const next: KampusKoinState = {
      balance: current.balance + entry.amount,
      entries: [entry, ...current.entries],
    }
    writeStore(KOIN_KEY, next)
    return next
  }

  private getKampusKoinStateSync(): KampusKoinState {
    const state = readStore<KampusKoinState | null>(KOIN_KEY, null)
    if (state) return state
    writeStore(KOIN_KEY, KOIN_SEED)
    return KOIN_SEED
  }
}

export const api: ApiClient = new MockApiClient()