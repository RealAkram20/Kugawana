import { router } from 'expo-router'
import { ArrowLeft, KeyRound, Lock, Mail } from 'lucide-react-native'
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
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { useResponsive } from '../../hooks/useResponsive'
import { authService } from '../../services/auth.service'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Two steps on one screen: ask for the account email, then take the 6-digit
 * code that email carries plus the new password. The server answers the email
 * step identically whether or not the account exists, so the copy promises
 * nothing more than "if that email belongs to an account".
 */
export default function ForgotPasswordScreen() {
  const { t } = useTranslation()
  const { maxContentWidth } = useResponsive()

  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const notify = (message: string) => Alert.alert(t('common.appName'), message)

  const sendCode = async () => {
    const trimmed = email.trim().toLowerCase()

    if (!EMAIL_PATTERN.test(trimmed)) return notify(t('forgot.invalidEmail'))

    setLoading(true)
    try {
      await authService.forgotPassword(trimmed)
      setStep('reset')
      notify(t('forgot.codeSent'))
    } catch {
      notify(t('forgot.failed'))
    } finally {
      setLoading(false)
    }
  }

  const reset = async () => {
    if (code.trim().length !== 6) return notify(t('forgot.invalidCode'))
    if (password.length < 8) return notify(t('forgot.passwordTooShort'))

    setLoading(true)
    try {
      await authService.resetPassword(email.trim().toLowerCase(), code.trim(), password)
      Alert.alert(t('common.appName'), t('forgot.success'), [
        { text: t('common.ok'), onPress: () => router.replace('/(auth)/login') },
      ])
    } catch (error: any) {
      notify(error.response?.data?.message ?? t('forgot.failed'))
    } finally {
      setLoading(false)
    }
  }

  const submit = step === 'email' ? sendCode : reset

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
              {t('forgot.title')}
            </Text>
            <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
              {step === 'email' ? t('forgot.subtitle') : t('forgot.resetSubtitle', { email })}
            </Text>

            {step === 'email' ? (
              <>
                <Text style={styles.label}>{t('forgot.email')}</Text>
                <View style={styles.field}>
                  <Mail size={20} color={colors.textSecondary} strokeWidth={2} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder={t('forgot.emailPlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    onSubmitEditing={sendCode}
                    returnKeyType="send"
                  />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>{t('forgot.code')}</Text>
                <View style={styles.field}>
                  <KeyRound size={20} color={colors.textSecondary} strokeWidth={2} />
                  <TextInput
                    style={styles.input}
                    value={code}
                    onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
                    placeholder={t('forgot.codePlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={6}
                    returnKeyType="next"
                  />
                </View>

                <Text style={styles.label}>{t('forgot.newPassword')}</Text>
                <View style={styles.field}>
                  <Lock size={20} color={colors.textSecondary} strokeWidth={2} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t('forgot.newPasswordPlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                    onSubmitEditing={reset}
                    returnKeyType="go"
                  />
                </View>

                <Pressable style={styles.resendRow} onPress={sendCode} disabled={loading}>
                  <Text style={styles.resendLink}>{t('forgot.resend')}</Text>
                </Pressable>
              </>
            )}

            <Pressable
              onPress={submit}
              disabled={loading}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, loading && styles.disabled]}
            >
              {loading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.primaryLabel}>
                  {step === 'email' ? t('forgot.sendCode') : t('forgot.resetButton')}
                </Text>
              )}
            </Pressable>
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
  resendRow: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
  },
  resendLink: {
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
})
