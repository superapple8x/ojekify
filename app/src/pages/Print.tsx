import { useState } from 'react'
import { StepShell } from '../flows/comparator/StepShell'
import { UploadStep } from '../flows/print/steps/UploadStep'
import { ShopStep } from '../flows/print/steps/ShopStep'
import { SummaryStep } from '../flows/print/steps/SummaryStep'
import { EMPTY_PRINT_DRAFT, PRINT_STEP_LABELS } from '../flows/print/types'
import type { PrintDraft, PrintStepIndex, PrintUpload } from '../flows/print/types'
import { api } from '../api'

export default function Print() {
  const [step, setStep] = useState<PrintStepIndex>(0)
  const [draft, setDraft] = useState<PrintDraft>(EMPTY_PRINT_DRAFT)

  const file = draft.file
  const pageCount = file?.pageCount ?? 0
  const counting = file !== null && file.pageCount === null

  function handleSelect(upload: PrintUpload) {
    setDraft((current) => ({ ...current, file: upload }))
    api.countPdfPages({ name: upload.name, sizeBytes: upload.sizeBytes }).then((count) => {
      setDraft((current) =>
        current.file === upload ? { ...current, file: { ...upload, pageCount: count } } : current,
      )
    })
  }

  function handleShopChange(patch: Partial<PrintDraft>) {
    setDraft((current) => {
      const next = { ...current, ...patch }
      if (next.colorMode === 'mixed') {
        const pages = next.file?.pageCount ?? 0
        if (pages > 1) {
          const maxBw = pages - 1
          next.mixedBwEnd = Math.min(maxBw, Math.max(1, next.mixedBwEnd ?? Math.floor(pages / 2)))
        }
      }
      return next
    })
  }

  const canContinue = file !== null && file.pageCount !== null
  const continueHint = !file
    ? 'Unggah file PDF dulu.'
    : counting
      ? 'Tunggu hitungan halaman…'
      : undefined

  const stepTitles = ['Unggah file 📄', 'Pengaturan cetak 🖨️', 'Ringkasan & order 💸']
  const stepSubtitles = [
    'File kamu tidak dikirim ke mana-mana — hanya dihitung halamannya lalu dibuatkan tautan aman untuk admin fotokopian.',
    'Persis seperti ditanyakan di fotokopian: warna, kertas, dan jilid.',
    'Biaya cetak dan ongkir dihitung terpisah — totalnya sudah pasti, tinggal kirim pesan WhatsApp.',
  ]

  return (
    <div className="animate-fade-in">
      <header className="mx-auto mb-8 max-w-2xl">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Cetak &amp; Antar <span className="text-brand-500">PilihJek</span>
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Upload file, pilih pengaturan cetak, dan diantar sampai depan kost tanpa ribet.
        </p>
      </header>

      <StepShell
        steps={PRINT_STEP_LABELS}
        current={step}
        enterable={Array.from({ length: step + 1 }, (_, index) => index as PrintStepIndex)}
        onStepClick={setStep}
        title={stepTitles[step]}
        subtitle={stepSubtitles[step]}
        onBack={step > 0 ? () => setStep((step - 1) as PrintStepIndex) : undefined}
        onContinue={
          step === 0
            ? () => setStep(1)
            : step === 1
              ? () => setStep(2)
              : undefined
        }
        continueDisabled={!canContinue}
        continueHint={step === 0 ? continueHint : undefined}
        continueLabel={step === 1 ? 'Lihat ringkasan' : 'Lanjut'}
      >
        {step === 0 ? (
          <UploadStep file={file} onSelect={handleSelect} onRemove={() => setDraft({ ...draft, file: null })} />
        ) : step === 1 ? (
          <ShopStep
            pageCount={pageCount}
            colorMode={draft.colorMode}
            mixedBwEnd={draft.mixedBwEnd}
            paper={draft.paper}
            weight={draft.weight}
            binding={draft.binding}
            onChange={handleShopChange}
          />
        ) : file ? (
          <SummaryStep
            file={file}
            pageCount={pageCount}
            colorMode={draft.colorMode}
            mixedBwEnd={draft.mixedBwEnd}
            paper={draft.paper}
            weight={draft.weight}
            binding={draft.binding}
            customerName={draft.customerName}
            deliverTo={draft.deliverTo}
            onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
          />
        ) : null}
      </StepShell>
    </div>
  )
}