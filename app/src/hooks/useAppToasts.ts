import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api'
import type { ToastData } from '../components'

const TOAST_EVENT = 'pilihjek:toast'
const REVIEW_POLL_MS = 15_000

export function pushAppToast(toast: Omit<ToastData, 'id'>) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: toast }))
}

export function useAppToasts() {
  const [toasts, setToasts] = useState<ToastData[]>([])
  const idRef = useRef(0)

  const push = useCallback((toast: Omit<ToastData, 'id'>) => {
    idRef.current += 1
    const id = idRef.current
    setToasts((current) => [...current, { ...toast, id }].slice(-3))
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  useEffect(() => {
    const onToastEvent = (event: Event) => {
      push((event as CustomEvent<Omit<ToastData, 'id'>>).detail)
    }
    window.addEventListener(TOAST_EVENT, onToastEvent)

    const pollReviewHooks = () => {
      if (document.hidden) return
      void api.getDueReviewHooks(Date.now()).then(async (hooks) => {
        for (const hook of hooks) {
          const notification = await api.deliverReviewHook(hook.orderId)
          push({ icon: '🔔', title: notification.title, body: notification.body })
        }
      })
    }
    pollReviewHooks()
    const interval = window.setInterval(pollReviewHooks, REVIEW_POLL_MS)

    return () => {
      window.removeEventListener(TOAST_EVENT, onToastEvent)
      window.clearInterval(interval)
    }
  }, [push])

  return { toasts, dismiss }
}