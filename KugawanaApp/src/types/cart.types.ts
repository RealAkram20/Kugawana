import type { Order } from './order.types'

/** A line in the basket. One food, plus how many units the receiver wants. */
export interface CartItem {
  foodId: number
  title: string
  image: string | null
  isSplit: boolean
  /** The size of one unit ("10 g") or the whole quantity ("2 Kg"). */
  unitLabel: string
  /** Points for one unit, or the whole listing when it is not split. */
  unitPoints: number
  /** How many units are on the shelf; 1 for a whole listing. */
  maxUnits: number
  units: number
  donorName?: string | null
}

export interface CheckoutItemInput {
  food_donation_id: number
  units: number
}

export interface CheckoutPayload {
  delivery_method: 'pickup' | 'delivery'
  delivery_address?: string
  items: CheckoutItemInput[]
}

/** Why a basket line did not go through in full, for the checkout summary. */
export type CheckoutReason = 'unavailable' | 'sold_out' | 'insufficient_points' | 'reduced'

export interface CheckoutNote {
  food_donation_id: number
  title: string | null
  reason: CheckoutReason
  /** Present on a 'reduced' note. */
  requested?: number
  placed?: number
}

export interface CheckoutResult {
  placed: Order[]
  skipped: CheckoutNote[]
  adjusted: CheckoutNote[]
}
