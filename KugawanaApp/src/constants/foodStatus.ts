import type { FoodListing } from '../types/food.types'

type StatusSource = Pick<FoodListing, 'is_active' | 'status'>

/**
 * Translation key for a listing's status chip.
 *
 * `is_active` already means "published and not yet expired", so a listing that
 * is still `published` without being active has simply run out of time — it
 * must not keep advertising itself as Active.
 */
export function statusLabelKey({ is_active, status }: StatusSource): string {
  if (is_active) return 'sharedFood.active'
  if (status === 'published') return 'sharedFood.status.expired'
  return `sharedFood.status.${status}`
}

/** Statuses that read as a good outcome get the brand green. */
const POSITIVE = ['completed', 'delivered']
const NEGATIVE = ['rejected', 'expired']

export function statusTone({ is_active, status }: StatusSource): 'positive' | 'negative' | 'neutral' {
  if (is_active || POSITIVE.includes(status)) return 'positive'
  if (NEGATIVE.includes(status) || status === 'published') return 'negative'
  return 'neutral'
}
