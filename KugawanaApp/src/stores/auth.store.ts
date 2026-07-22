import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { User } from '../types/user.types'

interface AuthState {
  token: string | null
  user: User | null
  hydrated: boolean
  setToken: (token: string | null) => void
  setUser: (user: User | null) => void
  setHydrated: () => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setHydrated: () => set({ hydrated: true }),
      clear: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    }
  )
)
