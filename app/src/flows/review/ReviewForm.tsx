import { useState } from 'react'
import {
  api,
  REVIEW_KOIN_REWARD,
  type ItemSafetyRating,
  type Provider,
  type ServiceId,
  type SpeedRating,
  type VibeTag,
} from '../../api'
import { SERVICES } from '../../api/providers'
import { Button, Card, ProviderAvatar, Toggle } from '../../components'
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
] as const

const WEATHER_OPTIONS = [
  { id: 'cerah', emoji: '☀️', label: 'Cerah' },
  { id: 'mendung', emoji: '⛅', label: 'Mendung' },
  { id: 'hujan', emoji: '🌧️', label: 'Hujan' },
  { id: 'panas', emoji: '🔥', label: 'Panas' },
]

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
  const [tagIds, setTagIds] = useState<string[]>([])

  const [serviceType, setServiceType] = useState<ServiceId>('ride')
  const [orderTime, setOrderTime] = useState(() => {
    const now = new Date()
    const offset = now.getTimezoneOffset()
    const local = new Date(now.getTime() - offset * 60_000)
    return local.toISOString().slice(0, 16)
  })
  const [weather, setWeather] = useState('cerah')
  const [pickupZone, setPickupZone] = useState('')
  const [dropoffZone, setDropoffZone] = useState('')
  const [driverName, setDriverName] = useState('')
  const [priceMatch, setPriceMatch] = useState(true)
  const [priceNote, setPriceNote] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [textReview, setTextReview] = useState('')
  const [anonymous, setAnonymous] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)

  const complete =
    speed !== null &&
    itemSafety !== null &&
    tagIds.length > 0 &&
    weather !== '' &&
    pickupZone.trim() !== '' &&
    dropoffZone.trim() !== ''

  const toggleTag = (id: string) =>
    setTagIds((current) =>
      current.includes(id) ? current.filter((tagId) => tagId !== id) : [...current, id],
    )

  const addPhoto = () => {
    if (photos.length >= 4) return
    const id = Math.floor(Math.random() * 1000)
    setPhotos((prev) => [...prev, `https://picsum.photos/seed/${id}/400/300`])
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!complete) return
    setSubmitting(true)
    try {
      const orderTimestamp = new Date(orderTime).getTime() || Date.now()
      await api.submitReview({
        providerId: provider.id,
        providerName: provider.name,
        providerEmoji: provider.emoji,
        speed: speed!,
        itemSafety: itemSafety!,
        priceHonesty: priceMatch ? 'sesuai-app' : 'minta-ekstra',
        tagIds,
        serviceType,
        orderTime: orderTimestamp,
        weather,
        pickupZone: pickupZone.trim(),
        dropoffZone: dropoffZone.trim(),
        driverName: driverName.trim(),
        adminResponseMinutes: 0,
        photos,
        textReview: textReview.trim(),
        anonymous,
        priceMatch,
        priceNote: priceMatch ? '' : priceNote.trim(),
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
            setTagIds([])
            setServiceType('ride')
            setOrderTime(() => {
              const now = new Date()
              const offset = now.getTimezoneOffset()
              const local = new Date(now.getTime() - offset * 60_000)
              return local.toISOString().slice(0, 16)
            })
            setWeather('cerah')
            setPickupZone('')
            setDropoffZone('')
            setDriverName('')
            setPriceMatch(true)
            setPriceNote('')
            setPhotos([])
            setTextReview('')
            setAnonymous(false)
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
        {/* ── Order Context ── */}
        <div className="space-y-3 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800/60">
          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
            📋 Konteks Pesanan
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="svc-type" className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                Layanan
              </label>
              <select
                id="svc-type"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceId)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold dark:border-neutral-700 dark:bg-neutral-900"
              >
                {SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.emoji} {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="weather" className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                Cuaca
              </label>
              <select
                id="weather"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold dark:border-neutral-700 dark:bg-neutral-900"
              >
                {WEATHER_OPTIONS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.emoji} {w.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="pickup" className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                Dari zona mana?
              </label>
              <input
                id="pickup"
                type="text"
                placeholder="Fasilkom"
                value={pickupZone}
                onChange={(e) => setPickupZone(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:placeholder:text-neutral-500"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="dropoff" className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                Ke zona mana?
              </label>
              <input
                id="dropoff"
                type="text"
                placeholder="Asrama"
                value={dropoffZone}
                onChange={(e) => setDropoffZone(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:placeholder:text-neutral-500"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="order-time" className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
              Waktu pemesanan
            </label>
            <input
              id="order-time"
              type="datetime-local"
              value={orderTime}
              onChange={(e) => setOrderTime(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold dark:border-neutral-700 dark:bg-neutral-900 sm:w-auto"
            />
          </div>
        </div>

        {/* ── Driver Info ── */}
        <section aria-label="Driver Info" className="space-y-2">
          <p className="text-sm font-bold">🏍️ Info Driver</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Siapa driver-nya? (opsional tapi membantu)</p>
          <input
            type="text"
            placeholder="Mas Budi"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-xs font-semibold placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:placeholder:text-neutral-500"
          />
        </section>

        {/* ── Price Check ── */}
        <section aria-label="Price Check" className="space-y-2.5">
          <div>
            <p className="text-sm font-bold">💸 Cek Harga</p>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">Bayar sesuai yang dihitung app?</p>
          </div>
          <div role="radiogroup" aria-label="Price check" className="flex flex-wrap gap-2">
            <button
              type="button"
              role="radio"
              aria-checked={priceMatch}
              onClick={() => setPriceMatch(true)}
              className={cn(
                'flex items-center gap-2 rounded-full border-2 px-3.5 py-2 text-xs font-semibold transition-all duration-200 active:scale-95',
                priceMatch
                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-emerald-500/50 dark:hover:text-emerald-300',
              )}
            >
              <span aria-hidden className="text-sm">✅</span>
              <span className="whitespace-nowrap">Sesuai App</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={!priceMatch}
              onClick={() => setPriceMatch(false)}
              className={cn(
                'flex items-center gap-2 rounded-full border-2 px-3.5 py-2 text-xs font-semibold transition-all duration-200 active:scale-95',
                !priceMatch
                  ? 'border-red-500 bg-red-500 text-white shadow-sm shadow-red-500/25'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-red-300 hover:text-red-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-red-500/50 dark:hover:text-red-300',
              )}
            >
              <span aria-hidden className="text-sm">❌</span>
              <span className="whitespace-nowrap">Bayar Lebih</span>
            </button>
          </div>
          {!priceMatch && (
            <input
              type="text"
              placeholder="Contoh: Driver minta uang hujan padahal cerah"
              value={priceNote}
              onChange={(e) => setPriceNote(e.target.value)}
              className="w-full rounded-lg border border-red-200 bg-white px-3 py-2.5 text-xs font-semibold placeholder:text-neutral-400 dark:border-red-500/30 dark:bg-neutral-900 dark:placeholder:text-neutral-500"
            />
          )}
        </section>

        {/* ── Pillar Selectors (Speed & Item Safety) ── */}
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

        {/* ── Photo Upload ── */}
        <section aria-label="Photo Upload" className="space-y-2">
          <p className="text-sm font-bold">📷 Foto Bukti</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Upload foto barang (opsional, maks 4)</p>
          <div className="flex flex-wrap gap-2">
            {photos.map((src, i) => (
              <div key={i} className="relative h-20 w-20">
                <img
                  src={src}
                  alt={`Bukti ${i + 1}`}
                  className="h-full w-full rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm"
                  aria-label={`Hapus foto ${i + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < 4 && (
              <button
                type="button"
                onClick={addPhoto}
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-neutral-300 text-neutral-400 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-neutral-700 dark:text-neutral-500 dark:hover:border-brand-500/50"
              >
                <span className="text-lg">+</span>
                <span className="text-[10px] font-semibold">Tambah</span>
              </button>
            )}
          </div>
        </section>

        {/* ── Text Review ── */}
        <section aria-label="Text Review" className="space-y-2">
          <p className="text-sm font-bold">💬 Tulis Ulasan</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Ceritakan pengalamanmu (opsional)</p>
          <textarea
            rows={3}
            placeholder="Mas Budi ramah banget, tapi admin lambat merespon…"
            value={textReview}
            onChange={(e) => setTextReview(e.target.value)}
            className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-xs font-semibold placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:placeholder:text-neutral-500"
          />
        </section>

        {/* ── Vibe Tags ── */}
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

        {/* ── Anonymity Toggle ── */}
        <div className="border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <Toggle
            checked={anonymous}
            onChange={setAnonymous}
            label="Kirim sebagai Mahasiswa Anonim"
            description="Namamu tidak akan ditampilkan di ulasan publik"
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
          : 'Isi konteks pesanan, nilai kedua pilar, + pilih minimal satu vibe tag dulu.'}
      </p>
    </Card>
  )
}
