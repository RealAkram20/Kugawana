import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Language = 'en' | 'sw' | 'fr'

interface AppState {
  language: Language | null
  setLanguage: (language: Language) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: null,
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
