import type { FoodListing } from './food.types'

export type OrderStatus = 'pending' | 'accepted' | 'completed' | 'cancelled'

export interface OrderProvider {
  id: number
  name: string
  profile_photo: string | null
  rating: number
  reviews_count: number
  contact_number: string | null
  /** E.164 digits for a wa.me link; null when the number is unusable. */
  whatsapp_number: string | null
}

export interface Order {
  id: number
  status: OrderStatus
  points_spent: number
  delivery_method: 'pickup' | 'delivery'
  delivery_address: string | null
  preferred_quantity: string | null
  scheduled_pickup_at: string | null
  need_by: string | null
  notes: string | null
  can_complete: boolean
  can_edit: boolean
  can_cancel: boolean
  can_rate: boolean
  my_rating: { stars: number; comment: string | null } | null
  time_ago: string
  created_at: string
  food: FoodListing | null
  provider: OrderProvider | null
  /** Present only on the detail endpoint, which loads the receiver. */
  requester?: OrderRequester
}

export interface OrderRequester {
  id: number
  name: string
  profile_photo: string | null
}

export interface UpdateOrderPayload {
  preferred_quantity?: string
  need_by?: string
  notes?: string
  delivery_address?: string
}

export interface PointPackage {
  id: number
  name: string
  points: number
  price: number
  currency: string
}

export interface WalletTransaction {
  id: number
  type: 'credit' | 'debit'
  points: number
  reason: string
  created_at: string
}
