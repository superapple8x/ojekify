import type { PriceConditions, SelectedPlace, ServiceExtras, ServiceId } from '../../api'

export interface ComparatorDraft {
  service: ServiceId | null
  pickup: SelectedPlace | null
  dropoff: SelectedPlace | null
  raining: boolean
  cashless: boolean
  forceNight: boolean
  extras: ServiceExtras
}

export const SERVICE_STEP_LABELS = ['Layanan', 'Rute', 'Ketentuan', 'Ekstra'] as const
export type ComparatorStepIndex = 0 | 1 | 2 | 3

export function enterableSteps(step: ComparatorStepIndex): ComparatorStepIndex[] {
  const count = Math.min(step + 1, 4)
  return Array.from({ length: count }, (_, index) => index as ComparatorStepIndex)
}

export function conditionsFromDraft(draft: ComparatorDraft, hour: number): PriceConditions {
  return {
    raining: draft.raining,
    payment: draft.cashless ? 'noncash' : 'cash',
    hour,
  }
}