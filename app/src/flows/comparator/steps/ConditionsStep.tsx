import { Card, Toggle } from '../../../components'
import { cn } from '../../../lib/cn'

export interface ConditionsStepProps {
  raining: boolean
  onRainingChange: (value: boolean) => void
  cashless: boolean
  onCashlessChange: (value: boolean) => void
  hour: number
  forceNight: boolean
  onForceNightChange: (value: boolean) => void
}

export function ConditionsStep({
  raining,
  onRainingChange,
  cashless,
  onCashlessChange,
  hour,
  forceNight,
  onForceNightChange,
}: ConditionsStepProps) {
  const isNight = hour >= 22
  const clockLabel = `${String(hour).padStart(2, '0')}.00`

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
        Beberapa ketentuan bisa menambah "cas" (surcharge) ke tarif — tergantung rules tiap provider.
        Deteksi malam otomatis dibaca dari jam perangkat, tapi bisa disimulasikan di sini.
      </p>

      <Card padding="sm" className="space-y-4">
        <Toggle
          checked={raining}
          onChange={onRainingChange}
          label="Sedang hujan? 🌧️"
          description="Menambahkan Cas Hujan ke tarif."
        />
        <Toggle
          checked={cashless}
          onChange={onCashlessChange}
          label="Bayar e-wallet / transfer?"
          description="Menambahkan Cas Non-Tunai di provider tertentu."
        />
      </Card>

      <Card padding="sm" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <span className="min-w-0">
            <span className="block text-sm font-semibold">
              Deteksi malam otomatis{' '}
              <span className="font-normal text-neutral-400 dark:text-neutral-500">(mock)</span>
            </span>
            <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
              Dibaca dari jam perangkat — sekarang{' '}
              <span className="font-semibold text-neutral-700 dark:text-neutral-200">{clockLabel}</span>
            </span>
          </span>
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-xs font-bold',
              isNight
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
            )}
          >
            {isNight ? '🌙 Malam aktif' : '☀️ Siang hari'}
          </span>
        </div>
        <Toggle
          checked={forceNight}
          onChange={onForceNightChange}
          label="Simulasi jam malam (demo)"
          description="Geser deteksi otomatis ke jam 23.00 untuk mengetes Cas Luar Jam."
        />
      </Card>
    </div>
  )
}