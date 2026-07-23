import * as Google from 'expo-auth-session/providers/google'
import { useCallback, useState } from 'react'
import * as WebBrowser from 'expo-web-browser'
import { authService } from '../services/auth.service'
import type { AuthResponse } from '../types/user.types'

WebBrowser.maybeCompleteAuthSession()

const env = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
}

/** False until OAuth client IDs are present in .env — the button says so rather than failing silently. */
export const googleConfigured = Object.values(env).some(Boolean)

/**
 * The provider hook throws while rendering if the current platform has no
 * client ID, which would take the whole screen down. Standing in a placeholder
 * keeps the screen alive; `googleConfigured` stops it ever being used.
 */
const PLACEHOLDER = 'unconfigured.apps.googleusercontent.com'

const clientIds = {
  webClientId: env.webClientId || PLACEHOLDER,
  androidClientId: env.androidClientId || PLACEHOLDER,
  iosClientId: env.iosClientId || PLACEHOLDER,
}

export type GoogleOutcome =
  | { status: 'success'; auth: AuthResponse }
  | { status: 'cancelled' }
  | { status: 'unconfigured' }
  | { status: 'error' }

/**
 * Opens Google's consent screen, then trades the returned ID token for a
 * Kugawana session. The token is verified server-side, so nothing here is
 * trusted beyond being passed through.
 *
 * Note: this needs a development or production build with the app's custom
 * scheme registered — Google rejects Expo Go's `exp://` redirect URI.
 */
export function useGoogleAuth() {
  const [request, , promptAsync] = Google.useIdTokenAuthRequest(clientIds)
  const [loading, setLoading] = useState(false)

  const signIn = useCallback(async (): Promise<GoogleOutcome> => {
    if (!googleConfigured || !request) {
      return { status: 'unconfigured' }
    }

    setLoading(true)
    try {
      const result = await promptAsync()

      if (result.type === 'dismiss' || result.type === 'cancel') {
        return { status: 'cancelled' }
      }

      const idToken = result.type === 'success' ? result.params?.id_token : undefined

      if (!idToken) {
        return { status: 'error' }
      }

      return { status: 'success', auth: await authService.google(idToken) }
    } catch {
      return { status: 'error' }
    } finally {
      setLoading(false)
    }
  }, [promptAsync, request])

  return { signIn, loading, ready: googleConfigured && Boolean(request) }
}
