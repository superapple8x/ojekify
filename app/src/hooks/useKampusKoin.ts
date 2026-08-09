import { useCallback, useEffect, useState } from 'react'
import { api, type KampusKoinState } from '../api'

export const KOIN_CHANGED_EVENT = 'pilihjek:koin-changed'

export function pushKoinChanged() {
  window.dispatchEvent(new CustomEvent(KOIN_CHANGED_EVENT))
}

export function useKampusKoin() {
  const [state, setState] = useState<KampusKoinState | null>(null)

  const refresh = useCallback(() => {
    void api.getKampusKoin().then(setState)
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener(KOIN_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(KOIN_CHANGED_EVENT, refresh)
  }, [refresh])

  return { state, refresh }
}