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
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { authService } from '../../services/auth.service'
import { useAuthStore } from '../../stores/auth.store'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginScreen() {
  const { t } = useTranslation()
  const setToken = useAuthStore((state) => state.setToken)
  const setUser = useAuthStore((state) => state.setUser)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [secure, setSecure] = useState(true)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!EMAIL_PATTERN.test(email.trim())) {
      Alert.alert(t('common.appName'), t('auth.invalidEmail'))
      return
    }
    if (password.length < 1) {
      Alert.alert(t('common.appName'), t('login.passwordRequired'))
      return
    }

    setLoading(true)
    try {
      const { token, user } = await authService.login(email.trim(), password)
      setToken(token)
      setUser(user)
      router.replace('/(tabs)')
    } catch (error: any) {
      const message =
        error.response?.status === 401 || error.response?.status === 422
          ? t('login.invalidCredentials')
          : t('login.failed')
      Alert.alert(t('common.appName'), message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
            <ArrowLeft size={26} color={colors.textPrimary} strokeWidth={2.2} />
          </Pressable>

          <Text style={styles.title}>{t('login.title')}</Text>
          <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

          <Text style={styles.label}>{t('login.email')}</Text>
          <View style={styles.field}>
            <Mail size={20} color={colors.textSecondary} strokeWidth={2} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t('login.emailPlaceholder')}
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
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
              autoComplete="password"
              onSubmitEditing={submit}
              returnKeyType="go"
            />
            <Pressable hitSlop={8} onPress={() => setSecure((prev) => !prev)}>
              {secure ? (
                <Eye size={20} color={colors.textSecondary} strokeWidth={2} />
              ) : (
                <EyeOff size={20} color={colors.textSecondary} strokeWidth={2} />
              )}
            </Pressable>
          </View>

          <Pressable
            disabled={loading}
            style={({ pressed }) => [styles.submit, pressed && styles.pressed, loading && styles.disabled]}
            onPress={submit}
          >
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.submitLabel}>{t('login.signIn')}</Text>
            )}
          </Pressable>

          <Pressable style={styles.registerRow} onPress={() => router.replace('/(auth)/register')}>
            <Text style={styles.registerText}>
              {t('login.noAccount')} <Text style={styles.registerLink}>{t('login.createOne')}</Text>
            </Text>
          </Pressable>
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
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  back: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  submit: {
    height: 58,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  submitLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.surface,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.6,
  },
  registerRow: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  registerLink: {
    color: colors.primary,
    fontWeight: '700',
  },
})
