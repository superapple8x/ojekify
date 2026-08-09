import { useEffect } from 'react'

export interface ToastData {
  id: number
  icon: string
  title: string
  body: string
}

export interface ToastStackProps {
  toasts: ToastData[]
  onDismiss: (id: number) => void
  autoDismissMs?: number
}

export function ToastStack({ toasts, onDismiss, autoDismissMs = 6000 }: ToastStackProps) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          autoDismissMs={autoDismissMs}
        />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: ToastData
  onDismiss: (id: number) => void
  autoDismissMs: number
}

function ToastItem({ toast, onDismiss, autoDismissMs }: ToastItemProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), autoDismissMs)
    return () => window.clearTimeout(timer)
  }, [toast.id, onDismiss, autoDismissMs])

  return (
    <div className="animate-slide-up pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-neutral-200 bg-white/95 p-3.5 shadow-pop backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
      <span className="text-lg" aria-hidden>
        {toast.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{toast.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
          {toast.body}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Tutup notifikasi"
        className="grid size-7 shrink-0 place-items-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
      >
        ✕
      </button>
    </div>
  )
}