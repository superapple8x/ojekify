import { ERRAND_KINDS } from '../../../api'
import type { ErrandKind, ServiceExtras, ServiceId } from '../../../api'
import { Chip, Slider } from '../../../components'
import { formatIDR } from '../../../lib/format'

export interface ExtrasStepProps {
  service: ServiceId
  extras: ServiceExtras
  onChange: (extra: ServiceExtras) => void
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-neutral-100 px-3 py-2 text-xs leading-relaxed text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
      {children}
    </p>
  )
}

export function ExtrasStep({ service, extras, onChange }: ExtrasStepProps) {
  if (service === 'ride') {
    return (
      <div className="space-y-4">
        <Hint>Naik ojek nggak ada biaya tambahan — cukup ketentuan di langkah sebelumnya.</Hint>
      </div>
    )
  }

  if (service === 'print') {
    return (
      <div className="space-y-4">
        <Hint>Detail cetak (jumlah file, kertas, warna) diatur di alur "Cetak & Antar" — nanti ya.</Hint>
      </div>
    )
  }

  if (service === 'food' || service === 'send') {
    const label = service === 'food' ? 'Berapa porsi?' : 'Berapa barang/bingkisan?'
    const unit = service === 'food' ? 'porsi' : 'barang'
    const value = extras.itemCount ?? 1
    return (
      <div className="space-y-5">
        <Slider
          min={1}
          max={20}
          step={1}
          label={label}
          value={value}
          format={(v) => `${v} ${unit}`}
          onChange={(v) => onChange({ ...extras, itemCount: v })}
        />
        <Hint>
          Provider tertentu menambah <b>Cas Kelipatan Item</b> mulai 5 unit — lihat rinciannya di
          "Transparent Receipt" nanti.
        </Hint>
      </div>
    )
  }

  const kind = extras.errandKind ?? 'other'
  const topupAmount = extras.topupAmount ?? 50_000
  const extraStores = extras.extraStores ?? 0

  return (
    <div className="space-y-5">
      <div role="radiogroup" aria-label="Jenis errand">
        <div className="mb-3 text-sm font-semibold">Jasanya apa?</div>
        <div className="flex flex-wrap gap-2">
          {ERRAND_KINDS.map((err) => (
            <Chip
              key={err.id}
              icon={err.emoji}
              selected={kind === err.id}
              onClick={() => onChange({ ...extras, errandKind: err.id as ErrandKind })}
            >
              {err.label}
            </Chip>
          ))}
        </div>
      </div>

      {kind === 'topup' && (
        <Slider
          min={10_000}
          max={300_000}
          step={5_000}
          label="Nominal top-up"
          value={topupAmount}
          format={(v) => formatIDR(v)}
          onChange={(v) => onChange({ ...extras, topupAmount: v })}
        />
      )}

      {kind !== 'topup' && (
        <Slider
          min={0}
          max={6}
          step={1}
          label="Mampir ke berapa tempat?"
          value={extraStores}
          format={(v) => (v === 0 ? 'Tidak ada' : `${v} tempat`)}
          onChange={(v) => onChange({ ...extras, extraStores: v })}
        />
      )}

      <Hint>
        {kind === 'topup'
          ? 'Biaya top-up berjenjang: makin besar nominal, makin besar cas-nya — beda per provider.'
          : (
              <>
                Setiap tempat singgah menambah <b>Cas Mampir</b> Rp 1.000–2.000 tergantung provider.
              </>
            )}
      </Hint>
    </div>
  )
}