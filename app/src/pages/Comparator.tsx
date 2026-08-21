import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  SERVICE_STEP_LABELS,
  type ComparatorDraft,
  type ComparatorStepIndex,
} from '../flows/comparator/types'
import { StepShell } from '../flows/comparator/StepShell'
import { ServiceStep } from '../flows/comparator/steps/ServiceStep'
import { RouteStep } from '../flows/comparator/steps/RouteStep'
import { ConditionsStep } from '../flows/comparator/steps/ConditionsStep'
import { ExtrasStep } from '../flows/comparator/steps/ExtrasStep'
import { ResultsView } from '../flows/comparator/ResultsView'
import type { ServiceId } from '../api'

const EMPTY_DRAFT: ComparatorDraft = {
  service: null,
  pickup: null,
  dropoff: null,
  raining: false,
  cashless: false,
  forceNight: false,
  extras: {},
}

const SERVICE_IDS: ServiceId[] = ['ride', 'food', 'send', 'print', 'jasa']

const STEPS: { title: string; subtitle: string }[] = [
  {
    title: 'Mau pesan apa?',
    subtitle: 'Pilih layanan dulu — langkah selanjutnya menyesuaikan (conditional form).',
  },
  {
    title: 'Rute jemput-antar',
    subtitle: 'Pilih lokasi jemput dan antar — tarif tetap dihitung dari zona terdekat.',
  },
  {
    title: 'Ketentuan pengantaran',
    subtitle: 'Cuaca, cara bayar, dan jam — yang bikin harga bisa naik turun.',
  },
  {
    title: 'Rincian tambahan',
    subtitle: 'Isi detail yang menyesuaikan layanan tadi biar cas-nya terhitung pas.',
  },
]

export default function Comparator() {
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState<ComparatorStepIndex>(0)
  const [draft, setDraft] = useState<ComparatorDraft>(() => {
    const param = searchParams.get('service')
    if (param && (SERVICE_IDS as string[]).includes(param)) {
      return { ...EMPTY_DRAFT, service: param as ServiceId }
    }
    return EMPTY_DRAFT
  })
  const [submitted, setSubmitted] = useState(false)

  const realHour = new Date().getHours()
  const hour = draft.forceNight ? 23 : realHour

  const canContinue =
    step === 0 ? draft.service !== null :
    step === 1 ? Boolean(draft.pickup && draft.dropoff && draft.pickup.zoneId !== draft.dropoff.zoneId) :
    step === 2 ? true :
    true

  const continueHint =
    step === 0 && !draft.service ? 'Pilih salah satu layanan dulu.' :
    step === 1 && !canContinue ? (draft.pickup && draft.dropoff && draft.pickup.zoneId === draft.dropoff.zoneId ? 'Jemput & antar tidak boleh sama.' : 'Pilih lokasi jemput dan lokasi antar.') :
    undefined

  const title = STEPS[step].title
  const subtitle = STEPS[step].subtitle

  return (
    <div className="animate-fade-in">
      <header className="mx-auto mb-8 max-w-2xl">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Komparator <span className="text-brand-500">PilihJek</span>
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Isi kebutuhanmu, bandingkan harga semua provider, tanpa ngitung manual.
        </p>
      </header>

      {submitted ? (
        <div className="mx-auto max-w-2xl">
          <ResultsView draft={draft} hour={hour} onEditRequest={() => setSubmitted(false)} />
        </div>
      ) : (
        <StepShell
          steps={SERVICE_STEP_LABELS}
          current={step}
          enterable={Array.from({ length: step + 1 }, (_, index) => index as ComparatorStepIndex)}
          onStepClick={setStep}
          title={title}
          subtitle={subtitle}
          onBack={step > 0 ? () => setStep((step - 1) as ComparatorStepIndex) : undefined}
          onContinue={() => {
            if (step === 3) {
              setSubmitted(true)
            } else {
              setStep((step + 1) as ComparatorStepIndex)
            }
          }}
          continueDisabled={!canContinue}
          continueLabel={step === 3 ? 'Siap bandingin 💸' : 'Lanjut'}
          continueHint={continueHint}
        >
          {step === 0 && (
            <ServiceStep
              selected={draft.service}
              onSelect={(service) => setDraft((current) => ({ ...current, service, extras: {} }))}
            />
          )}
          {step === 1 && (
            <RouteStep
              pickup={draft.pickup}
              dropoff={draft.dropoff}
              onChange={(pickup, dropoff) => setDraft((current) => ({ ...current, pickup, dropoff }))}
            />
          )}
          {step === 2 && (
            <ConditionsStep
              raining={draft.raining}
              onRainingChange={(value) => setDraft((current) => ({ ...current, raining: value }))}
              cashless={draft.cashless}
              onCashlessChange={(value) => setDraft((current) => ({ ...current, cashless: value }))}
              hour={hour}
              forceNight={draft.forceNight}
              onForceNightChange={(value) => setDraft((current) => ({ ...current, forceNight: value }))}
            />
          )}
          {step === 3 && draft.service && (
            <ExtrasStep
              service={draft.service}
              extras={draft.extras}
              onChange={(extras) => setDraft((current) => ({ ...current, extras }))}
            />
          )}
        </StepShell>
      )}
    </div>
  )
}