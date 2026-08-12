import { useQuery } from '@tanstack/react-query'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import { useCallback, useState } from 'react'
import { authService, type GoogleAuthConfig } from '../services/auth.service'
import type { AuthResponse } from '../types/user.types'

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin')

// The native module does not exist in Expo Go, and touching it there throws on
// evaluation. Load it lazily so the app still runs in Expo Go with Google
// sign-in simply unavailable, the same way push notifications degrade.
const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient

let googleSignin: GoogleSigninModule | null = null

if (!inExpoGo) {
  try {
    googleSignin = require('@react-native-google-signin/google-signin') as GoogleSigninModule
  } catch {
    // A build without the native module: the button stays disabled.
    googleSignin = null
  }
}

/** Build-time fallback for installs that predate the server-driven config. */
const envWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID

export type GoogleOutcome =
  | { status: 'success'; auth: AuthResponse }
  | { status: 'cancelled' }
  | { status: 'unconfigured' }
  | { status: 'error' }

/**
 * Signs in with Google and trades the resulting ID token for a Kugawana
 * session. The token is verified server-side, so nothing here is trusted
 * beyond being passed through.
 *
 * The web client ID comes from the server (`/auth/config`), which the console's
 * Settings → Google sign-in page controls — so an admin can turn Google login
 * on, off, or rotate credentials without an app release. Google issues the ID
 * token against that web client, which is exactly what the backend checks the
 * token's audience against.
 *
 * Android also needs an OAuth client of type Android registered for this
 * package name and signing certificate, but it is never named here: Google
 * matches it from the APK's own signature.
 */
export function useGoogleAuth() {
  const { data: server } = useQuery<GoogleAuthConfig | null>({
    queryKey: ['auth-config'],
    queryFn: () => authService.config().catch(() => null),
    staleTime: 5 * 60 * 1000,
  })

  const [loading, setLoading] = useState(false)

  const webClientId = server?.web_client_id || envWebClientId
  // Enabled unless the server has answered and said no — an unreachable server
  // must not hide the button from builds configured the old way through env.
  const enabled = server ? server.enabled : Boolean(envWebClientId)
  const configured = Boolean(googleSignin) && enabled && Boolean(webClientId)

  const signIn = useCallback(async (): Promise<GoogleOutcome> => {
    if (!googleSignin || !configured || !webClientId) {
      return { status: 'unconfigured' }
    }

    const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = googleSignin

    setLoading(true)
    try {
      // Configured per attempt so a client ID changed in the console takes
      // effect without restarting the app.
      GoogleSignin.configure({ webClientId })

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })

      const response = await GoogleSignin.signIn()

      if (!isSuccessResponse(response)) {
        return { status: 'cancelled' }
      }

      const idToken = response.data.idToken

      if (!idToken) {
        return { status: 'error' }
      }

      return { status: 'success', auth: await authService.google(idToken) }
    } catch (error) {
      if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { status: 'cancelled' }
      }

      return { status: 'error' }
    } finally {
      setLoading(false)
    }
  }, [configured, webClientId])

  return { signIn, loading, ready: configured }
}
