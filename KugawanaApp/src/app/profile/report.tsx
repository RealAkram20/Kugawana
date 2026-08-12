import { useMutation } from '@tanstack/react-query'
import { router, Stack } from 'expo-router'
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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { supportService } from '../../services/support.service'

const SUBJECT_MAX = 150
const MESSAGE_MAX = 2000

export default function ReportProblemScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const canSubmit = subject.trim().length > 0 && message.trim().length > 0

  const submit = useMutation({
    mutationFn: () => supportService.report(subject.trim(), message.trim()),
    onSuccess: () => {
      Alert.alert(t('common.appName'), t('help.reportThanks'), [
        {
          text: t('common.ok'),
          onPress: () => (router.canGoBack() ? router.back() : router.replace('/profile/help')),
        },
      ])
    },
    onError: (error: any) =>
      Alert.alert(
        t('common.appName'),
        error.response?.data?.message ?? t('help.reportFailed'),
      ),
  })

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('profile.reportProblem') }} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.intro}>{t('help.reportIntro')}</Text>

          <Text style={styles.label}>{t('help.reportSubject')}</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder={t('help.reportSubjectHint')}
            placeholderTextColor={colors.textMuted}
            maxLength={SUBJECT_MAX}
          />

          <Text style={styles.label}>{t('help.reportMessage')}</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={message}
            onChangeText={setMessage}
            placeholder={t('help.reportMessageHint')}
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            maxLength={MESSAGE_MAX}
          />
          <Text style={styles.counter}>
            {message.length}/{MESSAGE_MAX}
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              (!canSubmit || submit.isPending) && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            disabled={!canSubmit || submit.isPending}
            onPress={() => submit.mutate()}
          >
            {submit.isPending ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.buttonLabel}>{t('help.reportSubmit')}</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  textarea: {
    minHeight: 160,
    paddingTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
  },
})
