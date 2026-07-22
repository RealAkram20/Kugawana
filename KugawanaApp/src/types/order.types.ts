import type { FoodListing } from './food.types'

export type OrderStatus = 'pending' | 'accepted' | 'completed' | 'cancelled'

export interface Order {
  id: number
  status: OrderStatus
  points_spent: number
  delivery_method: 'pickup' | 'delivery'
  delivery_address: string | null
  created_at: string
  food: FoodListing | null
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
