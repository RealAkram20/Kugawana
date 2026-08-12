import { getLocales } from 'expo-localization'
import { router } from 'expo-router'
import { ChevronDown, Phone } from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CountryPicker } from '../../components/CountryPicker'
import { colors } from '../../constants/colors'
import { Country, DEFAULT_COUNTRY, findCountry, flagEmoji, toE164 } from '../../constants/countries'
import { spacing } from '../../constants/spacing'
import { useResponsive } from '../../hooks/useResponsive'
import { authService } from '../../services/auth.service'
import { useAuthStore } from '../../stores/auth.store'

/** The SIM/locale region, so most people never touch the country picker. */
function deviceCountry(): Country {
  const region = getLocales()[0]?.regionCode
  return findCountry(region) ?? DEFAULT_COUNTRY
}

/**
 * Collects the phone number an account is missing — Google sign-in proves the
 * email but tells us nothing about how to reach the member for pickups and
 * deliveries. There is no skip: the screen replaces the tabs until saved.
 */
export default function PhoneScreen() {
  const { t } = useTranslation()
  const { maxContentWidth } = useResponsive()
  const setUser = useAuthStore((state) => state.setUser)

  const [country, setCountry] = useState<Country>(deviceCountry)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const notify = (message: string) => Alert.alert(t('common.appName'), message)

  const submit = async () => {
    const nationalDigits = phone.replace(/\D/g, '').replace(/^0+/, '')

    if (nationalDigits.length < 6) return notify(t('auth.invalidPhone'))

    setLoading(true)
    try {
      const user = await authService.updateProfile({
        phone: toE164(country, phone),
        phone_country: country.iso,
      })
      setUser(user)
      router.replace('/(tabs)')
    } catch (error: any) {
      const taken = error?.response?.data?.errors?.phone
      notify(taken ? t('auth.phoneTaken') : t('auth.phoneCompletionFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.content, { maxWidth: maxContentWidth }]}>
            <View style={styles.badge}>
              <Phone size={30} color={colors.primary} strokeWidth={2.2} />
            </View>

            <Text style={styles.title} maxFontSizeMultiplier={1.25}>
              {t('auth.phoneCompletionTitle')}
            </Text>
            <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
              {t('auth.phoneCompletionSubtitle')}
            </Text>

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
                autoFocus
                onSubmitEditing={submit}
                returnKeyType="go"
              />
            </View>

            <Pressable
              onPress={submit}
              disabled={loading}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, loading && styles.disabled]}
            >
              {loading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.primaryLabel}>{t('common.continue')}</Text>
              )}
            </Pressable>
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
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
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
