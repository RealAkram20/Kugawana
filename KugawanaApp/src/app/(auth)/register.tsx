import { getLocales } from 'expo-localization'
import { router } from 'expo-router'
import { ArrowLeft, ChevronDown, Eye, EyeOff, Lock, Mail, User as UserIcon } from 'lucide-react-native'
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
import { CountryPicker } from '../../components/CountryPicker'
import { GoogleLogo } from '../../components/GoogleLogo'
import { colors } from '../../constants/colors'
import { Country, DEFAULT_COUNTRY, findCountry, flagEmoji, toE164 } from '../../constants/countries'
import { spacing } from '../../constants/spacing'
import { useGoogleAuth } from '../../hooks/useGoogleAuth'
import { useResponsive } from '../../hooks/useResponsive'
import { authService } from '../../services/auth.service'
import { useAuthStore } from '../../stores/auth.store'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 8

/** The SIM/locale region, so most people never touch the country picker. */
function deviceCountry(): Country {
  const region = getLocales()[0]?.regionCode
  return findCountry(region) ?? DEFAULT_COUNTRY
}

export default function RegisterScreen() {
  const { t } = useTranslation()
  const { maxContentWidth } = useResponsive()
  const setToken = useAuthStore((state) => state.setToken)
  const setUser = useAuthStore((state) => state.setUser)
  const google = useGoogleAuth()

  const [name, setName] = useState('')
  const [country, setCountry] = useState<Country>(deviceCountry)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [secure, setSecure] = useState(true)
  const [loading, setLoading] = useState(false)

  const notify = (message: string) => Alert.alert(t('common.appName'), message)

  const submit = async () => {
    const nationalDigits = phone.replace(/\D/g, '').replace(/^0+/, '')

    if (!name.trim()) return notify(t('auth.invalidName'))
    if (nationalDigits.length < 6) return notify(t('auth.invalidPhone'))
    if (!EMAIL_PATTERN.test(email.trim())) return notify(t('auth.invalidEmail'))
    if (password.length < MIN_PASSWORD) return notify(t('auth.passwordTooShort'))

    setLoading(true)
    try {
      const { token, user } = await authService.register({
        name: name.trim(),
        email: email.trim(),
        phone: toE164(country, phone),
        phone_country: country.iso,
        password,
      })
      setToken(token)
      setUser(user)
      router.replace('/(tabs)')
    } catch (error: any) {
      notify(registerError(error, t))
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
              {t('auth.createAccountTitle')}
            </Text>
            <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
              {t('auth.createAccountSubtitle')}
            </Text>

            <Text style={styles.label}>{t('auth.fullName')}</Text>
            <View style={styles.field}>
              <UserIcon size={20} color={colors.textSecondary} strokeWidth={2} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('auth.fullNamePlaceholder')}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
              />
            </View>

            <Text style={styles.label}>{t('auth.phoneNumber')}</Text>
            <View style={styles.field}>
              <Pressable
                style={styles.countryPicker}
                onPress={() => setPickerOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={t('auth.selectCountry')}
                hitSlop={6}
              >
                <Text style={styles.flag}>{flagEmoji(country.iso)}</Text>
                <ChevronDown size={16} color={colors.textPrimary} />
              </Pressable>
              <Text style={styles.dial}>+{country.dial}</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder={t('auth.phonePlaceholder')}
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                autoComplete="tel"
                maxLength={15}
              />
            </View>

            <Text style={styles.label}>{t('auth.emailAddress')}</Text>
            <View style={styles.field}>
              <Mail size={20} color={colors.textSecondary} strokeWidth={2} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            </View>

            <Text style={styles.label}>{t('auth.password')}</Text>
            <View style={styles.field}>
              <Lock size={20} color={colors.textSecondary} strokeWidth={2} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={t('auth.passwordCreatePlaceholder')}
                placeholderTextColor={colors.textMuted}
                secureTextEntry={secure}
                autoCapitalize="none"
                autoComplete="new-password"
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
            <Text style={styles.hint}>{t('auth.passwordHint', { min: MIN_PASSWORD })}</Text>

            <Pressable
              onPress={submit}
              disabled={busy}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, busy && styles.disabled]}
            >
              {loading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.primaryLabel}>{t('auth.signUp')}</Text>
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

            <Pressable style={styles.switchRow} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.switchText}>
                {t('login.haveAccount')} <Text style={styles.switchLink}>{t('auth.signIn')}</Text>
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

      <CountryPicker
        visible={pickerOpen}
        selected={country}
        onSelect={setCountry}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  )
}

/** Turns Laravel's 422 field errors into one line the user can act on. */
function registerError(error: any, t: (key: string) => string): string {
  const errors = error?.response?.data?.errors

  if (errors?.email) return t('auth.emailTaken')
  if (errors?.phone) return t('auth.phoneTaken')
  if (errors) return String(Object.values(errors)[0])

  return t('auth.registerFailed')
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
    marginTop: spacing.md,
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
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flag: {
    fontSize: 22,
  },
  dial: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  hint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.sm,
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
