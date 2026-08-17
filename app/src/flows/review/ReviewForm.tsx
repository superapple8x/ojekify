import { useState } from 'react'
import {
  api,
  REVIEW_KOIN_REWARD,
  type ItemSafetyRating,
  type PriceHonestyRating,
  type Provider,
  type SpeedRating,
  type VibeTag,
} from '../../api'
import { Button, Card, ProviderAvatar } from '../../components'
import { cn } from '../../lib/cn'
import { pushAppToast } from '../../hooks/useAppToasts'
import { pushKoinChanged } from '../../hooks/useKampusKoin'

interface PillarOption<T extends string> {
  id: T
  emoji: string
  label: string
  hint: string
}

const PILLAR_OPTIONS = [
  {
    options: [
      { id: 'lambat', emoji: '🐌', label: 'Snail-pace', hint: 'Telat melulu' },
      { id: 'standar', emoji: '🚶', label: 'Standard', hint: 'Pas-pasan, masih oke' },
      { id: 'ngebut', emoji: '⚡', label: 'Flash-speed', hint: 'Keburu sebelum deadline' },
    ] as PillarOption<SpeedRating>[],
  },
  {
    options: [
      { id: 'berantakan', emoji: '💦', label: 'Messy', hint: 'Tumpah, kusut, penyok' },
      { id: 'aman', emoji: '📦', label: 'Safe', hint: 'Utuh asal sampai' },
      { id: 'sempurna', emoji: '✨', label: 'Perfect', hint: 'Rapi, kayak nggak diantar' },
    ] as PillarOption<ItemSafetyRating>[],
  },
  {
    options: [
      { id: 'minta-ekstra', emoji: '😤', label: 'Demanded Extra', hint: 'Minta uang tambahan di luar app' },
      { id: 'sesuai-app', emoji: '😇', label: 'Respected the Price', hint: 'Sesuai app, tanpa drama' },
    ] as PillarOption<PriceHonestyRating>[],
  },
] as const

function PillarSelector<T extends string>({
  title,
  hint,
  selected,
  options,
  onChange,
}: {
  title: string
  hint: string
  selected: T | null
  options: PillarOption<T>[]
  onChange: (value: T) => void
}) {
  return (
    <section aria-label={title} className="space-y-2.5">
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{hint}</p>
      </div>
      <div role="radiogroup" aria-label={`Pilih penilaian ${title}`} className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected === option.id
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.id)}
              className={cn(
                'flex items-center gap-2 rounded-full border-2 px-3.5 py-2 text-xs font-semibold transition-all duration-200 active:scale-95',
                isSelected
                  ? 'border-brand-500 bg-brand-500 text-white shadow-sm shadow-brand-500/25'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-brand-300 hover:text-brand-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-brand-500/50 dark:hover:text-brand-300',
              )}
            >
              <span aria-hidden className="text-sm">{option.emoji}</span>
              <span className="whitespace-nowrap">{option.label}</span>
              {!isSelected && (
                <span aria-hidden className="hidden text-[10px] font-normal sm:inline">
                  {option.hint}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function VibeTagPicker({
  title,
  hint,
  tags,
  selected,
  onToggle,
  tone,
}: {
  title: string
  hint: string
  tags: VibeTag[]
  selected: string[]
  onToggle: (id: string) => void
  tone: 'positive' | 'warning'
}) {
  if (tags.length === 0) return null
  const look = (isSelected: boolean) =>
    tone === 'positive'
      ? isSelected
        ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
        : 'border-emerald-200 bg-white text-emerald-700 hover:border-emerald-400 dark:border-emerald-500/30 dark:bg-neutral-900 dark:text-emerald-300'
      : isSelected
        ? 'border-red-500 bg-red-500 text-white shadow-sm shadow-red-500/25'
        : 'border-red-200 bg-white text-red-700 hover:border-red-400 dark:border-red-500/30 dark:bg-neutral-900 dark:text-red-300'
  return (
    <section aria-label={title} className="space-y-2">
      <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
        {title} <span className="font-normal">{hint}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selected.includes(tag.id)
          return (
            <button
              key={tag.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(tag.id)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border-2 px-3 py-1 text-[11px] font-semibold transition-all duration-200 active:scale-95',
                look(isSelected),
              )}
            >
              {isSelected && <span aria-hidden>✓</span>}
              {tag.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function ReviewForm({ provider }: { provider: Provider }) {
  const [speed, setSpeed] = useState<SpeedRating | null>(null)
  const [itemSafety, setItemSafety] = useState<ItemSafetyRating | null>(null)
  const [priceHonesty, setPriceHonesty] = useState<PriceHonestyRating | null>(null)
  const [tagIds, setTagIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)

  const complete = speed !== null && itemSafety !== null && priceHonesty !== null && tagIds.length > 0

  const toggleTag = (id: string) =>
    setTagIds((current) =>
      current.includes(id) ? current.filter((tagId) => tagId !== id) : [...current, id],
    )

  const handleSubmit = async () => {
    if (!complete) return
    setSubmitting(true)
    try {
      await api.submitReview({
        providerId: provider.id,
        providerName: provider.name,
        providerEmoji: provider.emoji,
        speed: speed!,
        itemSafety: itemSafety!,
        priceHonesty: priceHonesty!,
        tagIds,
        serviceType: 'ride',
        orderTime: Date.now(),
        weather: 'cerah',
        pickupZone: '',
        dropoffZone: '',
        driverName: '',
        adminResponseMinutes: 0,
        photos: [],
        textReview: '',
        anonymous: false,
        priceMatch: true,
        priceNote: '',
      })
      const koin = await api.getKampusKoin()
      setBalance(koin.balance)
      setSubmitted(true)
      pushAppToast({
        icon: '🪙',
        title: `+${REVIEW_KOIN_REWARD} KampusKoin`,
        body: `Ulasan ${provider.name} terkirim — saldo kamu sekarang ${koin.balance.toLocaleString('id-ID')}.`,
      })
      pushKoinChanged()
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Card padding="lg" className="text-center">
        <div className="flex justify-center">
          <ProviderAvatar name={provider.name} emoji={provider.emoji} seed={provider.id} size="xl" />
        </div>
        <h2 className="mt-4 text-lg font-extrabold tracking-tight">Ulasan terkirim! 🎉</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Makasih, {provider.name}. Skor pilar & vibe tag kamu sudah masuk ke hitungan rating.
        </p>
        <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50 px-4 py-2 text-sm font-extrabold text-amber-700 tabular-nums dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <span aria-hidden>🪙</span>
          +{REVIEW_KOIN_REWARD} KampusKoin
          {balance !== null && <span className="font-semibold">— saldo {balance.toLocaleString('id-ID')}</span>}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={() => {
            setSubmitted(false)
            setBalance(null)
            setSpeed(null)
            setItemSafety(null)
            setPriceHonesty(null)
            setTagIds([])
          }}
        >
          Tulis ulasan lagi
        </Button>
      </Card>
    )
  }

  const positiveTags = provider.tags.filter((tag) => tag.kind === 'positive')
  const warningTags = provider.tags.filter((tag) => tag.kind === 'warning')

  return (
    <Card padding="lg">
      <h2 className="flex items-center gap-2 text-sm font-extrabold">
        <span aria-hidden>✍️</span> Tulis ulasan kamu
      </h2>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        Tiga pilar utama kehidupan kampus — plus vibe tag dari pengalamanmu dengan {provider.name}.
      </p>

      <div className="mt-5 space-y-5">
        <PillarSelector
          title="⏱️ Speed"
          hint="Sampai sebelum deadline?"
          selected={speed}
          options={PILLAR_OPTIONS[0].options}
          onChange={setSpeed}
        />
        <PillarSelector
          title="📦 Item Safety"
          hint="Barang aman, tidak tumpah atau kusut?"
          selected={itemSafety}
          options={PILLAR_OPTIONS[1].options}
          onChange={setItemSafety}
        />
        <PillarSelector
          title="💸 Price Honesty"
          hint="Harga sesuai hasil banding, tanpa uang tambahan?"
          selected={priceHonesty}
          options={PILLAR_OPTIONS[2].options}
          onChange={setPriceHonesty}
        />

        <div className="space-y-4 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <VibeTagPicker
            title="🟢 Positive tags"
            hint="— tap yang kamu rasakan"
            tags={positiveTags}
            selected={tagIds}
            onToggle={toggleTag}
            tone="positive"
          />
          <VibeTagPicker
            title="🔴 Warning tags"
            hint="— kalau ada yang janggal"
            tags={warningTags}
            selected={tagIds}
            onToggle={toggleTag}
            tone="warning"
          />
        </div>
      </div>

      <Button
        block
        className="mt-5"
        disabled={!complete}
        loading={submitting}
        onClick={handleSubmit}
      >
        {submitting ? 'Mengirim…' : 'Kirim ulasan ⭐'}
      </Button>
      <p className="mt-2 text-center text-xs text-neutral-500 dark:text-neutral-400" aria-live="polite">
        {complete
          ? 'Semua lengkap — kirim udah bisa.'
          : 'Nilai ketiga pilar + pilih minimal satu vibe tag dulu.'}
      </p>
    </Card>
  )
}