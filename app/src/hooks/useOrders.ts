import { useCallback, useEffect, useState } from 'react'
import { api, type OrderItem } from '../api'

export const ORDERS_CHANGED_EVENT = 'pilihjek:orders-changed'

export function pushOrdersChanged() {
  window.dispatchEvent(new CustomEvent(ORDERS_CHANGED_EVENT))
}

export function useOrders() {
  const [orders, setOrders] = useState<OrderItem[] | null>(null)

  const refresh = useCallback(() => {
    void api.getOrders().then(setOrders)
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener(ORDERS_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(ORDERS_CHANGED_EVENT, refresh)
  }, [refresh])

  return { orders, refresh }
}