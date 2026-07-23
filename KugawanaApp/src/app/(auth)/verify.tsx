import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, ChevronDown, Lock, MapPin, User } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
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
import { useAuthStore } from '../../stores/auth.store'

const CODE_LENGTH = 6
const RESEND_SECONDS = 25

const LOCATIONS = [
  'Kampala, Uganda',
  'Nairobi, Kenya',
  'Mombasa, Kenya',
  'Kisumu, Kenya',
  'Nakuru, Kenya',
]

function formatPhone(raw?: string) {
  if (!raw) return '+254 7XX XXX XXX'
  const match = raw.match(/^(\+254)(\d+)$/)
  if (!match) return raw
  const grouped = match[2].replace(/(\d{3})(?=\d)/g, '$1 ')
  return `${match[1]} ${grouped}`
}

export default function VerifyScreen() {
  const { t } = useTranslation()
  const { phone, email } = useLocalSearchParams<{ phone?: string; email?: string }>()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
  const codeInputRef = useRef<TextInput>(null)
  const setToken = useAuthStore((state) => state.setToken)
  const setUser = useAuthStore((state) => state.setUser)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [secondsLeft > 0])

  const resend = () => {
    setSecondsLeft(RESEND_SECONDS)
  }

  const submit = () => {
    if (code.length < CODE_LENGTH) {
      Alert.alert(t('common.appName'), t('auth.invalidCode'))
      return
    }
    if (!name.trim()) {
      Alert.alert(t('common.appName'), t('auth.invalidName'))
      return
    }
    if (!location) {
      Alert.alert(t('common.appName'), t('auth.invalidLocation'))
      return
    }
    // Local session until the backend OTP endpoint exists
    setToken('local-session')
    setUser({
      id: 0,
      name: name.trim(),
      email: email ?? '',
      phone: phone ?? null,
      role: 'receiver',
      country_id: null,
      district: location,
      address: null,
      bio: null,
      profile_photo: null,
      wallet_balance: 0,
      responsibility_score: 0,
    })
    router.replace('/(auth)/profile-setup')
  }

  const digits = Array.from({ length: CODE_LENGTH }, (_, i) => code[i] ?? '')
  const timerLabel = `00:${String(Math.max(secondsLeft, 0)).padStart(2, '0')}`

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
            <ArrowLeft size={26} color={colors.textPrimary} strokeWidth={2.2} />
          </Pressable>

          <Text style={styles.title}>{t('auth.verifyNumberTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.codeSentTo')}</Text>
          <Text style={styles.phone}>{formatPhone(phone)}</Text>

          <Pressable style={styles.otpRow} onPress={() => codeInputRef.current?.focus()}>
            {digits.map((digit, index) => (
              <View
                key={index}
                style={[styles.otpBox, index === code.length && code.length < CODE_LENGTH && styles.otpBoxActive]}
              >
                <Text style={styles.otpDigit}>{digit}</Text>
              </View>
            ))}
          </Pressable>
          <TextInput
            ref={codeInputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, CODE_LENGTH))}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            autoFocus
          />

          {secondsLeft > 0 ? (
            <Text style={styles.resendText}>
              {t('auth.resendCodeIn')} <Text style={styles.resendTimer}>{timerLabel}</Text>
            </Text>
          ) : (
            <Pressable onPress={resend}>
              <Text style={[styles.resendText, styles.resendTimer]}>{t('auth.resendCode')}</Text>
            </Pressable>
          )}

          <Text style={styles.sectionTitle}>{t('auth.completeProfile')}</Text>

          <Text style={styles.label}>{t('auth.fullName')}</Text>
          <View style={styles.field}>
            <User size={20} color={colors.textSecondary} style={styles.fieldIcon} />
            <TextInput
              style={styles.fieldInput}
              value={name}
              onChangeText={setName}
              placeholder={t('auth.fullNamePlaceholder')}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />
          </View>

          <Text style={styles.label}>{t('auth.location')}</Text>
          <Pressable style={styles.field} onPress={() => setPickerOpen((open) => !open)}>
            <MapPin size={20} color={colors.textSecondary} style={styles.fieldIcon} />
            <Text style={[styles.fieldInput, styles.pickerValue, !location && styles.pickerPlaceholder]}>
              {location || t('auth.selectLocation')}
            </Text>
            <ChevronDown size={20} color={colors.textPrimary} />
          </Pressable>
          {pickerOpen ? (
            <View style={styles.pickerList}>
              {LOCATIONS.map((item) => (
                <Pressable
                  key={item}
                  style={styles.pickerItem}
                  onPress={() => {
                    setLocation(item)
                    setPickerOpen(false)
                  }}
                >
                  <Text style={[styles.pickerItemText, item === location && styles.pickerItemActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Pressable onPress={submit} style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
            <Text style={styles.continueLabel}>{t('common.continue')}</Text>
          </Pressable>

          <View style={styles.secureRow}>
            <Lock size={18} color={colors.textPrimary} />
            <Text style={styles.secureText}>{t('auth.secureInfo')}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  back: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  phone: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  otpBox: {
    flex: 1,
    height: 64,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: colors.primary,
  },
  otpDigit: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  resendText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  resendTimer: {
    color: colors.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.xl * 2,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  fieldIcon: {
    marginRight: spacing.sm,
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  pickerValue: {
    paddingVertical: spacing.md,
  },
  pickerPlaceholder: {
    color: colors.textMuted,
  },
  pickerList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginTop: -spacing.md,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  pickerItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  pickerItemText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  pickerItemActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  continueButton: {
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  continueLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.surface,
  },
  pressed: {
    opacity: 0.85,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  secureText: {
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: 'center',
    flexShrink: 1,
  },
})
