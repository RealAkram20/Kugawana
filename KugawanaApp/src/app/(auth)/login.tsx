import { router } from 'expo-router'
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GoogleLogo } from '../../components/GoogleLogo'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { useGoogleAuth } from '../../hooks/useGoogleAuth'
import { useResponsive } from '../../hooks/useResponsive'
import { authService } from '../../services/auth.service'
import { useAuthStore } from '../../stores/auth.store'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Accepts either an email address or a phone number in any common shape.
 * Seven digits is the shortest national number in use worldwide.
 */
function isUsableIdentifier(value: string): boolean {
  if (value.includes('@')) return EMAIL_PATTERN.test(value)
  return value.replace(/\D/g, '').length >= 7
}

export default function LoginScreen() {
  const { t } = useTranslation()
  const { maxContentWidth } = useResponsive()
  const setToken = useAuthStore((state) => state.setToken)
  const setUser = useAuthStore((state) => state.setUser)
  const google = useGoogleAuth()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [secure, setSecure] = useState(true)
  const [loading, setLoading] = useState(false)

  const notify = (message: string) => Alert.alert(t('common.appName'), message)

  const submit = async () => {
    const trimmed = identifier.trim()

    if (!isUsableIdentifier(trimmed)) return notify(t('login.invalidIdentifier'))
    if (!password) return notify(t('login.passwordRequired'))

    setLoading(true)
    try {
      const { token, user } = await authService.login(trimmed, password)
      setToken(token)
      setUser(user)
      router.replace('/(tabs)')
    } catch (error: any) {
      const status = error.response?.status
      notify(status === 401 || status === 422 ? t('login.invalidCredentials') : t('login.failed'))
    } finally {
      setLoading(false)
    }
  }

  const continueWithGoogle = async () => {
    const outcome = await google.signIn()

    if (outcome.status === 'success') {
      setToken(outcome.auth.token)
      setUser(outcome.auth.user)
      router.replace('/(tabs)')
      return
    }
    if (outcome.status === 'unconfigured') return notify(t('auth.googleNotConfigured'))
    if (outcome.status === 'error') return notify(t('auth.googleFailed'))
  }

  const busy = loading || google.loading

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.content, { maxWidth: maxContentWidth }]}>
            <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
              <ArrowLeft size={26} color={colors.textPrimary} strokeWidth={2.2} />
            </Pressable>

            <Text style={styles.title} maxFontSizeMultiplier={1.25}>
              {t('login.title')}
            </Text>
            <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
              {t('login.subtitle')}
            </Text>

            <Text style={styles.label}>{t('login.identifier')}</Text>
            <View style={styles.field}>
              <Mail size={20} color={colors.textSecondary} strokeWidth={2} />
              <TextInput
                style={styles.input}
                value={identifier}
                onChangeText={setIdentifier}
                placeholder={t('login.identifierPlaceholder')}
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                returnKeyType="next"
              />
            </View>

            <Text style={styles.label}>{t('login.password')}</Text>
            <View style={styles.field}>
              <Lock size={20} color={colors.textSecondary} strokeWidth={2} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={t('login.passwordPlaceholder')}
                placeholderTextColor={colors.textMuted}
                secureTextEntry={secure}
                autoCapitalize="none"
                autoComplete="current-password"
                onSubmitEditing={submit}
                returnKeyType="go"
              />
              <Pressable
                hitSlop={10}
                onPress={() => setSecure((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={t(secure ? 'auth.showPassword' : 'auth.hidePassword')}
              >
                {secure ? (
                  <Eye size={20} color={colors.textSecondary} strokeWidth={2} />
                ) : (
                  <EyeOff size={20} color={colors.textSecondary} strokeWidth={2} />
                )}
              </Pressable>
            </View>

            <Pressable style={styles.forgotRow} onPress={() => notify(t('login.forgotComingSoon'))}>
              <Text style={styles.forgotLink}>{t('login.forgotPassword')}</Text>
            </Pressable>

            <Pressable
              onPress={submit}
              disabled={busy}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, busy && styles.disabled]}
            >
              {loading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.primaryLabel}>{t('login.signIn')}</Text>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('auth.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              onPress={continueWithGoogle}
              disabled={busy}
              style={({ pressed }) => [styles.googleButton, pressed && styles.pressed, busy && styles.disabled]}
            >
              {google.loading ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : (
                <>
                  <GoogleLogo />
                  <Text style={styles.googleLabel}>{t('auth.continueWithGoogle')}</Text>
                </>
              )}
            </Pressable>

            <Pressable style={styles.switchRow} onPress={() => router.replace('/(auth)/register')}>
              <Text style={styles.switchText}>
                {t('login.noAccount')} <Text style={styles.switchLink}>{t('auth.signUp')}</Text>
              </Text>
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.agreePrefix')}</Text>
              <Pressable>
                <Text style={styles.footerLink}>{t('auth.termsAndPrivacy')}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  back: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginTop: spacing.xl,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
  },
  forgotLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  primaryLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.surface,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  googleButton: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  googleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  switchRow: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  switchLink: {
    color: colors.primary,
    fontWeight: '700',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.xs,
  },
})
