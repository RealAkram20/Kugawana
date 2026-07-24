import { Stack } from 'expo-router'
import { ChevronRight, FileText, Flag, HelpCircle, Mail } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { CartButton } from '../../components/CartButton'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'

export default function HelpScreen() {
  const { t } = useTranslation()
  const comingSoon = () => Alert.alert(t('common.appName'), t('common.comingSoon'))

  const rows: { label: string; Icon: typeof Mail; color: string; onPress: () => void }[] = [
    { label: t('profile.faq'), Icon: HelpCircle, color: '#7C3AED', onPress: comingSoon },
    {
      label: t('profile.contactUs'),
      Icon: Mail,
      color: colors.primary,
      onPress: () => Linking.openURL('mailto:support@kugawana.app').catch(comingSoon),
    },
    { label: t('profile.reportProblem'), Icon: Flag, color: colors.error, onPress: comingSoon },
    { label: t('profile.terms'), Icon: FileText, color: '#2F6FED', onPress: comingSoon },
  ]

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('profile.helpTitle'), headerRight: () => <CartButton /> }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>{t('profile.helpIntro')}</Text>
        <View style={styles.card}>
          {rows.map((row, index) => (
            <Pressable
              key={row.label}
              onPress={row.onPress}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <row.Icon size={22} color={row.color} strokeWidth={2} />
              <Text style={styles.rowLabel}>{row.label}</Text>
              <ChevronRight size={20} color={colors.textMuted} strokeWidth={2} />
              {index < rows.length - 1 && <View style={styles.divider} />}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    position: 'relative',
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  divider: {
    position: 'absolute',
    left: 22 + spacing.md,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: colors.border,
  },
})
