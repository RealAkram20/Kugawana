import { router } from 'expo-router'
import { BookOpen, ChevronRight, LogOut, Package, ShoppingBag, Wallet } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Card } from '../../components/ui/Card'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { authService } from '../../services/auth.service'
import { Language, useAppStore } from '../../stores/app.store'
import { useAuthStore } from '../../stores/auth.store'

const languages: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'fr', label: 'Français' },
]

export default function ProfileScreen() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const clear = useAuthStore((state) => state.clear)
  const language = useAppStore((state) => state.language)
  const setLanguage = useAppStore((state) => state.setLanguage)

  const signOut = async () => {
    try {
      await authService.logout()
    } catch {
    } finally {
      clear()
      router.replace('/(auth)/register')
    }
  }

  const rows = [
    { label: t('profile.wallet'), route: '/profile/wallet' as const, Icon: Wallet },
    { label: t('profile.myDonations'), route: '/profile/donations' as const, Icon: Package },
    { label: t('profile.myRequests'), route: '/profile/requests' as const, Icon: ShoppingBag },
    { label: t('home.learn'), route: '/learn' as const, Icon: BookOpen },
  ]

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.slice(0, 1) ?? '?'}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.meta}>{user?.email}</Text>
          <Text style={styles.score}>
            {t('profile.score')}: {user?.responsibility_score ?? 100}
          </Text>
        </View>

        <Card style={styles.section}>
          {rows.map((row, index) => (
            <Pressable
              key={row.label}
              onPress={() => router.push(row.route)}
              style={[styles.row, index < rows.length - 1 && styles.rowBorder]}
            >
              <row.Icon size={20} color={colors.primary} strokeWidth={2} />
              <Text style={styles.rowLabel}>{row.label}</Text>
              <ChevronRight size={20} color={colors.textMuted} />
            </Pressable>
          ))}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
          <View style={styles.langRow}>
            {languages.map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => setLanguage(lang.code)}
                style={[styles.lang, language === lang.code && styles.langActive]}
              >
                <Text style={[styles.langLabel, language === lang.code && styles.langLabelActive]}>
                  {lang.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Pressable onPress={signOut} style={styles.signOut}>
          <LogOut size={18} color={colors.error} />
          <Text style={styles.signOutLabel}>{t('profile.signOut')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.surface,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  score: {
    marginTop: spacing.xs,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  langRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  lang: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.sm,
  },
  langActive: {
    borderColor: colors.primary,
    backgroundColor: '#EDF5ED',
  },
  langLabel: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  langLabelActive: {
    color: colors.primary,
  },
  signOut: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  signOutLabel: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
})
