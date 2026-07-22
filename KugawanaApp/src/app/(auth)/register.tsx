import { router } from 'expo-router'
import { ArrowLeft, ChevronDown, Mail } from 'lucide-react-native'
import { useState } from 'react'
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
import Svg, { Path, Rect } from 'react-native-svg'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function KenyaFlag() {
  return (
    <Svg width={28} height={20} viewBox="0 0 28 20">
      <Rect width={28} height={20} rx={3} fill="#000000" />
      <Rect y={6} width={28} height={8} fill="#BB0000" />
      <Rect y={14} width={28} height={6} fill="#006600" />
      <Rect y={5.2} width={28} height={0.8} fill="#FFFFFF" />
      <Rect y={14} width={28} height={0.8} fill="#FFFFFF" />
      <Path d="M14 3.5c-1.7 1.8-2.6 4-2.6 6.5s.9 4.7 2.6 6.5c1.7-1.8 2.6-4 2.6-6.5s-.9-4.7-2.6-6.5z" fill="#FFFFFF" />
      <Path d="M14 4.8c-1.3 1.5-2 3.3-2 5.2s.7 3.7 2 5.2c1.3-1.5 2-3.3 2-5.2s-.7-3.7-2-5.2z" fill="#BB0000" />
      <Rect x={13.6} y={7} width={0.8} height={6} fill="#FFFFFF" />
    </Svg>
  )
}

function GoogleLogo() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  )
}

export default function RegisterScreen() {
  const { t } = useTranslation()
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = () => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 9) {
      Alert.alert(t('common.appName'), t('auth.invalidPhone'))
      return
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      Alert.alert(t('common.appName'), t('auth.invalidEmail'))
      return
    }
    setLoading(true)
    router.push({
      pathname: '/(auth)/verify',
      params: { phone: `+254${digits}`, email: email.trim() },
    })
    setLoading(false)
  }

  const googleSignIn = () => {
    Alert.alert(t('common.appName'), t('auth.googleComingSoon'))
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
            <ArrowLeft size={26} color={colors.textPrimary} strokeWidth={2.2} />
          </Pressable>

          <Text style={styles.title}>{t('auth.getStartedTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.getStartedSubtitle')}</Text>

          <View style={styles.form}>
            <Text style={styles.label}>{t('auth.phoneNumber')}</Text>
            <View style={styles.field}>
              <Pressable style={styles.countryPicker}>
                <KenyaFlag />
                <ChevronDown size={16} color={colors.textPrimary} />
              </Pressable>
              <Text style={styles.prefix}>+254</Text>
              <TextInput
                style={styles.fieldInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="7XX XXX XXX"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                maxLength={12}
              />
            </View>

            <Text style={styles.label}>{t('auth.emailAddress')}</Text>
            <View style={styles.field}>
              <Mail size={20} color={colors.textSecondary} style={styles.fieldIcon} />
              <TextInput
                style={styles.fieldInput}
                value={email}
                onChangeText={setEmail}
                placeholder="youremail@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <Pressable
            onPress={submit}
            disabled={loading}
            style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}
          >
            <Text style={styles.continueLabel}>{t('common.continue')}</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable onPress={googleSignIn} style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}>
            <GoogleLogo />
            <Text style={styles.googleLabel}>{t('auth.continueWithGoogle')}</Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.agreePrefix')}</Text>
            <Pressable>
              <Text style={styles.footerLink}>{t('auth.termsAndPrivacy')}</Text>
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
    marginBottom: spacing.xl * 2,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl * 1.5,
  },
  form: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: spacing.sm,
  },
  prefix: {
    fontSize: 16,
    color: colors.textPrimary,
    marginRight: spacing.sm,
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
  continueButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.surface,
  },
  pressed: {
    opacity: 0.85,
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
    borderRadius: 14,
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
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.xs,
  },
})
