import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { CartItem } from '../types/cart.types'

interface CartState {
  items: CartItem[]
  /** Whether the slide-in basket popup is showing. Never persisted. */
  open: boolean
  openCart: () => void
  closeCart: () => void
  /** Adds a food, or tops up its unit count if it is already in the basket. */
  add: (item: CartItem) => void
  setUnits: (foodId: number, units: number) => void
  remove: (foodId: number) => void
  removeMany: (foodIds: number[]) => void
  clear: () => void
}

/** Keeps a chosen count within 1..maxUnits so the basket never asks for more
 * than the shelf holds. */
function clampUnits(units: number, max: number): number {
  return Math.max(1, Math.min(units, Math.max(1, max)))
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      open: false,
      openCart: () => set({ open: true }),
      closeCart: () => set({ open: false }),
      add: (item) =>
        set((state) => {
          const existing = state.items.find((line) => line.foodId === item.foodId)

          if (!existing) {
            return { items: [...state.items, { ...item, units: clampUnits(item.units, item.maxUnits) }] }
          }

          // Same food added again: raise the count and refresh the live details
          // (stock, points, thumbnail) from the newest read.
          return {
            items: state.items.map((line) =>
              line.foodId === item.foodId
                ? { ...line, ...item, units: clampUnits(existing.units + item.units, item.maxUnits) }
                : line
            ),
          }
        }),
      setUnits: (foodId, units) =>
        set((state) => ({
          items: state.items.map((line) =>
            line.foodId === foodId ? { ...line, units: clampUnits(units, line.maxUnits) } : line
          ),
        })),
      remove: (foodId) =>
        set((state) => ({ items: state.items.filter((line) => line.foodId !== foodId) })),
      removeMany: (foodIds) =>
        set((state) => ({ items: state.items.filter((line) => !foodIds.includes(line.foodId)) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
)

/** Total points the current basket would cost. */
export function cartTotalPoints(items: CartItem[]): number {
  return items.reduce((sum, line) => sum + line.unitPoints * line.units, 0)
}

/** Total units across the basket, for the header badge. */
export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, line) => sum + line.units, 0)
}
