import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
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

const TOKEN_KEY = 'auth-token'

// The bearer token is the live credential for the account, so it belongs in
// the OS keychain/keystore (encrypted, per-app) rather than AsyncStorage
// (plaintext). SecureStore isn't available on web, so fall back there.
const tokenStore = {
  get: () => (Platform.OS === 'web' ? AsyncStorage.getItem(TOKEN_KEY) : SecureStore.getItemAsync(TOKEN_KEY)),
  set: (token: string) =>
    Platform.OS === 'web' ? AsyncStorage.setItem(TOKEN_KEY, token) : SecureStore.setItemAsync(TOKEN_KEY, token),
  remove: () => (Platform.OS === 'web' ? AsyncStorage.removeItem(TOKEN_KEY) : SecureStore.deleteItemAsync(TOKEN_KEY)),
}

// Everything except the token still goes through AsyncStorage as plain JSON;
// the token is stripped out on write and spliced back in on read.
const storage: StateStorage = {
  getItem: async (name) => {
    const [raw, token] = await Promise.all([AsyncStorage.getItem(name), tokenStore.get()])

    if (!raw) return token ? JSON.stringify({ state: { token, user: null } }) : null

    const parsed = JSON.parse(raw)
    parsed.state.token = token ?? null

    return JSON.stringify(parsed)
  },
  setItem: async (name, value) => {
    const parsed = JSON.parse(value)
    const { token, ...rest } = parsed.state

    await Promise.all([
      token ? tokenStore.set(token) : tokenStore.remove(),
      AsyncStorage.setItem(name, JSON.stringify({ ...parsed, state: rest })),
    ])
  },
  removeItem: async (name) => {
    await Promise.all([tokenStore.remove(), AsyncStorage.removeItem(name)])
  },
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
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    }
  )
)
