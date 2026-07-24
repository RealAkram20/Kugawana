import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect } from 'react'
import { View } from 'react-native'
import { CartSheet } from '../components/CartSheet'
import i18n from '../locales/i18n'
import { useAppStore } from '../stores/app.store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

// The native splash is now a plain #FDFDFB panel matching the branded splash in
// index.tsx. Holding it until the first layout means the branded screen is the
// only one anybody actually sees, instead of a logo flashing in front of it.
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const language = useAppStore((state) => state.language)

  useEffect(() => {
    if (language) i18n.changeLanguage(language)
  }, [language])

  const onLayout = useCallback(() => {
    SplashScreen.hideAsync()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }} onLayout={onLayout}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        {/* Mounted once so any screen's basket button opens the same popup. */}
        <CartSheet />
      </View>
    </QueryClientProvider>
  )
}
