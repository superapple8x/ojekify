import { useRef, useState } from 'react'
import type { DragEvent } from 'react'
import type { PrintUpload } from '../types'
import { formatSize } from '../../../lib/format'
import { cn } from '../../../lib/cn'
import { Skeleton } from '../../../components'

export interface UploadStepProps {
  file: PrintUpload | null
  onSelect: (file: PrintUpload) => void
  onRemove: () => void
}

function isPdf(file: File): boolean {
  const byType = file.type === 'application/pdf'
  const byExt = /\.pdf$/i.test(file.name)
  return byType || byExt
}

export function UploadStep({ file, onSelect, onRemove }: UploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)

  function handleFiles(files: FileList | null) {
    const candidate = files?.[0]
    if (!candidate) return
    if (!isPdf(candidate)) {
      setWarning('Bukan PDF ya — biar hasil cetak nggak berantakan, simpan dulu jadi PDF!')
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    setWarning(null)
    onSelect({ name: candidate.name, sizeBytes: candidate.size, pageCount: null })
  }

  function handleDragOver(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setDragging(true)
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setDragging(false)
    handleFiles(event.dataTransfer?.files ?? null)
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(event) => handleFiles(event.target.files)}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200',
          'bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:bg-neutral-900 dark:focus-visible:ring-offset-neutral-950',
          dragging
            ? 'scale-[1.01] border-brand-500 bg-brand-50/60 dark:bg-brand-500/10'
            : 'border-neutral-300 hover:border-brand-400 hover:bg-brand-50/40 dark:border-neutral-700 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/5',
        )}
      >
        <span aria-hidden className="text-3xl">
          {dragging ? '📥' : '📄'}
        </span>
        <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
          {dragging ? 'Lepaskan file di sini…' : 'Tarik & letakkan file, atau ketuk untuk memilih'}
        </span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          Hanya .pdf yang diterima — hasil cetak dijamin rapi.
        </span>
      </button>

      {warning && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-semibold leading-relaxed text-red-700 dark:bg-red-500/10 dark:text-red-300"
        >
          ⚠️ {warning}
        </p>
      )}

      {file && (
        <div className="flex items-center gap-3 rounded-xl border-2 border-neutral-200 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
          <span aria-hidden className="text-2xl">
            🖨️
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {file.name}
            </p>
            <p className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="shrink-0">{formatSize(file.sizeBytes)}</span>
              {file.pageCount === null ? (
                <span className="flex items-center gap-1.5">
                  <Skeleton className="h-3 w-16" />
                  Menghitung halaman…
                </span>
              ) : (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  📄 Terdeteksi {file.pageCount} halaman
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setWarning(null)
              onRemove()
            }}
            className="rounded-full border-2 border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600 transition-colors hover:border-red-300 hover:text-red-600 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-red-500/50 dark:hover:text-red-400"
          >
            Hapus
          </button>
        </div>
      )}
    </div>
  )
}