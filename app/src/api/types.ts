export type ServiceId = 'ride' | 'food' | 'send' | 'print' | 'jasa'
export type ErrandKind = 'galon' | 'gas' | 'topup' | 'other'
export type PrintColorMode = 'bw' | 'color' | 'mixed'
export type PaperSizeId = 'a4' | 'f4' | 'a3'
export type PaperWeightId = '70' | '80'
export type BindingId = 'none' | 'staples' | 'tape' | 'spiral'
export type PaymentMethod = 'cash' | 'noncash'
export type ProviderTier = 'newbie' | 'verified' | 'legend'
export type VibeTagKind = 'positive' | 'warning'
export type ZoneArea = 'kampus' | 'luar'

export interface ServiceMeta {
  id: ServiceId
  label: string
  emoji: string
  description: string
}

export interface Zone {
  id: string
  name: string
  area: ZoneArea
  emoji: string
  x: number
  y: number
}

export interface FareBand {
  maxKm: number
  price: number
}

export interface ItemCas {
  startAt: number
  step: number
  fee: number
}

export interface NightCas {
  from: number
  fee: number
}

export interface TopupTier {
  upto: number | null
  fee: number
}

export interface CasRules {
  rain: number
  cashless: number
  night: NightCas
  itemFee: ItemCas | null
  perStore: number
  topup: TopupTier[]
}

export type WaFieldId = 'service' | 'pickup' | 'dropoff' | 'payment' | 'items' | 'notes'

export interface WaTemplate {
  id: string
  greeting: string
  separator: string
  fields: WaFieldId[]
  needsName: boolean
  includeFareSummary: boolean
}

export interface VibeTag {
  id: string
  label: string
  kind: VibeTagKind
}

export interface Provider {
  id: string
  name: string
  tagline: string
  emoji: string
  phone: string
  tier: ProviderTier
  rating: number
  reviews: number
  responseTimeMinutes: number
  noHiddenFees: boolean
  openHours: string
  fares: Partial<Record<ServiceId, FareBand[]>>
  cas: CasRules
  waTemplate: WaTemplate
  tags: VibeTag[]
}

export interface PriceConditions {
  raining: boolean
  payment: PaymentMethod
  hour: number
}

export interface ServiceExtras {
  itemCount?: number
  extraStores?: number
  topupAmount?: number
  errandKind?: ErrandKind
}

export interface QuoteRequest {
  service: ServiceId
  pickupZoneId: string
  dropoffZoneId: string
  conditions: PriceConditions
  extras?: ServiceExtras
}

export interface ReceiptLine {
  kind: 'base' | 'cas'
  label: string
  amount: number
  detail?: string
}

export interface Quote {
  providerId: string
  service: ServiceId
  pickupZoneId: string
  dropoffZoneId: string
  distanceKm: number
  total: number
  lines: ReceiptLine[]
}

export type ResultTag = 'cheapest' | 'fastest' | 'noHiddenFees'

export interface ComparisonRow {
  provider: Provider
  quote: Quote
  tag: ResultTag | null
  rank: number
}

export interface ComparisonResult {
  rows: ComparisonRow[]
}

export interface ReviewPillars {
  speed: number
  itemSafety: number
  priceHonesty: number
}

export interface VibeTagCount extends VibeTag {
  count: number
}

export interface ProviderReview {
  providerId: string
  score: number
  pillars: ReviewPillars
  totalRatings: number
  positiveTags: VibeTagCount[]
  warningTags: VibeTagCount[]
  ghostReportsWeek: number
}

export type SpeedRating = 'lambat' | 'standar' | 'ngebut'
export type ItemSafetyRating = 'berantakan' | 'aman' | 'sempurna'
export type PriceHonestyRating = 'minta-ekstra' | 'sesuai-app'

export interface ReviewSubmissionInput {
  providerId: string
  providerName: string
  providerEmoji: string
  speed: SpeedRating
  itemSafety: ItemSafetyRating
  priceHonesty: PriceHonestyRating
  tagIds: string[]
  serviceType: ServiceId
  orderTime: number
  weather: string
  pickupZone: string
  dropoffZone: string
  driverName: string
  adminResponseMinutes: number
  photos: string[]
  textReview: string
  anonymous: boolean
  priceMatch: boolean
  priceNote: string
}

export interface ReviewSubmission extends ReviewSubmissionInput {
  id: string
  createdAt: number
}

export interface IndividualReview extends ReviewSubmission {}

export interface LeaderboardEntry {
  rank: number
  providerId: string
  title: string
  subtitle: string
  emoji: string
}

export interface PdfDescriptor {
  name: string
  sizeBytes: number
}

export type DisputeKind = 'ghosted' | 'no-show'

export interface DisputeReport {
  id: string
  providerId: string
  kind: DisputeKind
  at: number
}

export interface DisputeSubmissionInput {
  providerId: string
  providerName: string
  providerEmoji: string
  kind: DisputeKind
}

export type OrderStatus = 'pending' | 'proses' | 'selesai' | 'dibatalkan'

export interface OrderItem {
  id: string
  createdAt: number
  status: OrderStatus
  providerId: string
  providerName: string
  providerEmoji: string
  serviceLabel: string
  pickupName: string
  dropoffName: string
  total: number
  waUrl: string
  reviewPendingAt: number | null
}

export interface PlaceOrderInput {
  providerId: string
  providerName: string
  providerEmoji: string
  serviceLabel: string
  pickupName: string
  dropoffName: string
  total: number
  waUrl: string
}

export type NotificationKind =
  | 'order-confirmed'
  | 'review-hook'
  | 'dispute-logged'

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  body: string
  at: number
  read: boolean
}

export interface DueReviewHook {
  orderId: string
  providerId: string
  providerName: string
  providerEmoji: string
  total: number
}

export interface ApiClient {
  getServices(): Promise<ServiceMeta[]>
  getZones(): Promise<Zone[]>
  getProviders(): Promise<Provider[]>
  getProvider(id: string): Promise<Provider | undefined>
  getReviews(): Promise<ProviderReview[]>
  getReview(providerId: string): Promise<ProviderReview | undefined>
  getIndividualReviews(providerId: string): Promise<IndividualReview[]>
  getLeaderboard(): Promise<LeaderboardEntry[]>
  getLeaderboardWeek(): Promise<string>
  submitReview(input: ReviewSubmissionInput): Promise<ReviewSubmission>
  reportDispute(input: DisputeSubmissionInput): Promise<DisputeReport>
  getDisputes(): Promise<DisputeReport[]>
  getQuote(providerId: string, request: QuoteRequest): Promise<Quote | undefined>
  compareQuote(request: QuoteRequest): Promise<ComparisonResult>
  countPdfPages(pdf: PdfDescriptor): Promise<number>
  /** Tautan unduh aman (mock: cloud print link, real: one-time URL). */
  getPrintFileLink(pdf: PdfDescriptor): Promise<string>
  placeOrder(input: PlaceOrderInput): Promise<OrderItem>
  getOrders(): Promise<OrderItem[]>
  /** Alur status mock: pending/proses → selesai|dibatalkan. */
  updateOrderStatus(orderId: string, next: OrderStatus): Promise<OrderItem | undefined>
  getNotifications(): Promise<AppNotification[]>
  markNotificationsRead(): Promise<void>
  getDueReviewHooks(now: number): Promise<DueReviewHook[]>
  deliverReviewHook(orderId: string): Promise<AppNotification>
}