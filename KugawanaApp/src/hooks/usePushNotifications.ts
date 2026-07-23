import { useQueryClient } from '@tanstack/react-query'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import * as Device from 'expo-device'
import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { notificationsService } from '../services/notifications.service'
import { useAuthStore } from '../stores/auth.store'

type NotificationsModule = typeof import('expo-notifications')

// Remote push was removed from Expo Go on Android in SDK 53, and the native
// module throws the moment it is evaluated there. Load it lazily so the app
// still runs in Expo Go, where push simply stays disabled.
const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient

let Notifications: NotificationsModule | null = null

if (!inExpoGo) {
  Notifications = require('expo-notifications') as NotificationsModule

  // How a push behaves while the app is open in the foreground.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  })
}

/** EAS project the push token is minted against; absent until `eas init` is run. */
const projectId =
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined

/**
 * The token this device last registered. Kept at module scope so sign-out can
 * release it without the Profile screen needing the hook.
 */
let activeToken: string | null = null

export async function releasePushToken(): Promise<void> {
  if (!activeToken) return

  try {
    await notificationsService.removePushToken(activeToken)
  } catch {
    // Signing out must never be blocked by a failed cleanup.
  } finally {
    activeToken = null
  }
}

async function fetchToken(): Promise<string | null> {
  // Expo Go and simulators have no push service to register with.
  if (!Notifications || !Device.isDevice) return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Kugawana',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    })
  }

  const existing = await Notifications.getPermissionsAsync()
  const granted =
    existing.granted || (await Notifications.requestPermissionsAsync()).granted

  if (!granted || !projectId) return null

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId })
  return data
}

/**
 * Registers this device for push once the user is signed in, and keeps the
 * in-app list fresh when a notification arrives or is tapped.
 *
 * Remote push needs a development or production build — Expo Go on Android has
 * not supported it since SDK 53. Everything else here degrades quietly.
 */
export function usePushNotifications() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()
  const registered = useRef<string | null>(null)

  useEffect(() => {
    if (!token) {
      registered.current = null
      return
    }

    let cancelled = false

    fetchToken()
      .then(async (pushToken) => {
        if (cancelled || !pushToken || registered.current === pushToken) return
        await notificationsService.registerPushToken(pushToken, Platform.OS)
        registered.current = pushToken
        activeToken = pushToken
      })
      .catch(() => {
        // A device that refuses push must still be able to use the app.
      })

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!Notifications) return

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['notifications'] })

    const received = Notifications.addNotificationReceivedListener(refresh)
    const responded = Notifications.addNotificationResponseReceivedListener(refresh)

    return () => {
      received.remove()
      responded.remove()
    }
  }, [queryClient])
}
