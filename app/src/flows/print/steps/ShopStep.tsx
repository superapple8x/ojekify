import type { ReactNode } from 'react'
import type { BindingId, PaperSizeId, PaperWeightId, PrintColorMode } from '../../../api'
import { BINDINGS, COLOR_MODES, PAPER_SIZES, PAPER_WEIGHTS } from '../../../api'
import { Chip, Slider } from '../../../components'
import { formatIDR } from '../../../lib/format'
import { cn } from '../../../lib/cn'

export interface ShopStepProps {
  pageCount: number
  colorMode: PrintColorMode
  mixedBwEnd: number
  paper: PaperSizeId
  weight: PaperWeightId
  binding: BindingId
  onChange: (patch: Partial<{
    colorMode: PrintColorMode
    mixedBwEnd: number
    paper: PaperSizeId
    weight: PaperWeightId
    binding: BindingId
  }>) => void
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{title}</h3>
        {hint && (
          <p className="mt-0.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{hint}</p>
        )}
      </div>
      {children}
    </section>
  )
}

export function ShopStep({
  pageCount,
  colorMode,
  mixedBwEnd,
  paper,
  weight,
  binding,
  onChange,
}: ShopStepProps) {
  const maxBwEnd = Math.max(1, pageCount - 1)
  const mixedDisabled = pageCount <= 1

  return (
    <div className="space-y-7">
      <Section title="Warna 🎨" hint={mixedDisabled ? 'File hanya 1 halaman, jadi mode campuran tidak tersedia.' : undefined}>
        <div role="radiogroup" aria-label="Mode warna cetak" className="flex flex-wrap gap-2">
          {COLOR_MODES.map((mode) => (
            <Chip
              key={mode.id}
              icon={mode.emoji}
              selected={colorMode === mode.id}
              disabled={mixedDisabled && mode.id === 'mixed'}
              onClick={() => onChange({ colorMode: mode.id })}
            >
              {mode.label}
            </Chip>
          ))}
        </div>

        {colorMode === 'mixed' && !mixedDisabled && (
          <div className="space-y-2 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800/50">
            <Slider
              min={1}
              max={maxBwEnd}
              step={1}
              label="Perbatasan halaman hitam putih"
              value={Math.min(Math.max(mixedBwEnd, 1), maxBwEnd)}
              format={(value) => `${value} halaman B&W`}
              onChange={(value) => onChange({ mixedBwEnd: value })}
            />
            <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              Halaman 1–{Math.min(Math.max(mixedBwEnd, 1), maxBwEnd)} dicetak{' '}
              <b className="text-neutral-700 dark:text-neutral-200">hitam putih</b>, halaman{' '}
              {Math.min(Math.max(mixedBwEnd, 1), maxBwEnd) + 1}–{pageCount}{' '}
              <b className="text-neutral-700 dark:text-neutral-200">warna</b>.
            </p>
          </div>
        )}
      </Section>

      <Section title="Ukuran kertas 📐" hint="A4 · F4 · A3 — ukuran folio Indonesia umum dipakai fotokopian.">
        <div role="radiogroup" aria-label="Ukuran kertas" className="flex flex-wrap gap-2">
          {PAPER_SIZES.map((size) => (
            <Chip
              key={size.id}
              selected={paper === size.id}
              onClick={() => onChange({ paper: size.id })}
            >
              {size.label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Berat kertas 📄">
        <div role="radiogroup" aria-label="Berat kertas" className="flex flex-wrap gap-2">
          {PAPER_WEIGHTS.map((weightOption) => (
            <Chip
              key={weightOption.id}
              selected={weight === weightOption.id}
              onClick={() => onChange({ weight: weightOption.id })}
            >
              {weightOption.label}
            </Chip>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          80 gr terasa lebih tebal &amp; eksklusif di tangan — 70 gr standar dokumen harian.
        </p>
      </Section>

      <Section title="Finishing / Jilid 🛠️">
        <div role="radiogroup" aria-label="Finishing dan jilid" className="space-y-2">
          {BINDINGS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={binding === option.id}
              onClick={() => onChange({ binding: option.id })}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200',
                binding === option.id
                  ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10'
                  : 'border-neutral-200 bg-white hover:border-brand-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-brand-500/50',
              )}
            >
              <span aria-hidden className="text-xl">{option.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {option.label}
                </span>
                <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                  {option.description}
                </span>
              </span>
              <span
                className={cn(
                  'shrink-0 text-sm font-bold tabular-nums',
                  option.price === 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-neutral-900 dark:text-neutral-100',
                )}
              >
                {option.price === 0 ? 'Gratis' : `+ ${formatIDR(option.price)}`}
              </span>
            </button>
          ))}
        </div>
      </Section>
    </div>
  )
}