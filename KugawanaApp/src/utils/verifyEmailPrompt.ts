import { Alert } from 'react-native'
import { authService } from '../services/auth.service'

type Translate = (key: string, opts?: Record<string, unknown>) => string

/**
 * Shows the "verify your email" dialog after a gated register/login, with a
 * Resend action. `onDone` runs when the member dismisses (e.g. to send them back
 * to the login screen after registering).
 */
export function promptEmailVerification(
  t: Translate,
  email: string,
  message: string,
  onDone?: () => void,
) {
  Alert.alert(t('auth.verifyTitle'), message, [
    {
      text: t('auth.verifyResend'),
      onPress: async () => {
        try {
          await authService.resendVerification(email)
          Alert.alert(t('common.appName'), t('auth.verifyResent'))
        } catch {
          Alert.alert(t('common.appName'), t('auth.verifyResendFailed'))
        }
      },
    },
    { text: t('common.ok'), style: 'cancel', onPress: onDone },
  ])
}

/** True when a register/login error is the verification gate rather than a failure. */
export function isVerificationRequired(error: any): boolean {
  return error?.response?.data?.email_verification_required === true
}
