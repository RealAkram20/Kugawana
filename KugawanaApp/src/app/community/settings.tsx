import { router } from 'expo-router'
import { Bell, ChevronRight, Lock, Pencil, ShieldCheck, UserRound } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'

export default function CommunitySettingsScreen() {
  const { t } = useTranslation()
  const comingSoon = () => Alert.alert(t('common.appName'), t('common.comingSoon'))

  const rows: { label: string; sub?: string; Icon: typeof Bell; onPress: () => void }[] = [
    { label: t('communitySettings.notifications'), Icon: Bell, onPress: comingSoon },
    { label: t('communitySettings.privacy'), sub: t('communitySettings.privacyValue'), Icon: Lock, onPress: comingSoon },
    { label: t('communitySettings.blockedUsers'), Icon: UserRound, onPress: comingSoon },
    { label: t('communitySettings.guidelines'), Icon: ShieldCheck, onPress: comingSoon },
    { label: t('communitySettings.reportPost'), Icon: Pencil, onPress: comingSoon },
  ]

  const leave = () => {
    Alert.alert(t('communitySettings.leave'), t('communitySettings.leaveConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('communitySettings.leave'),
        style: 'destructive',
        onPress: () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/community')),
      },
    ])
  }

  const next = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/community'))

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('communitySettings.title')}</Text>

        <View style={styles.list}>
          {rows.map((row) => (
            <Pressable
              key={row.label}
              onPress={row.onPress}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <row.Icon size={24} color={colors.textPrimary} strokeWidth={2} />
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                {!!row.sub && <Text style={styles.rowSub}>{row.sub}</Text>}
              </View>
              <ChevronRight size={22} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={leave}
          style={({ pressed }) => [styles.leaveBtn, pressed && styles.leavePressed]}
        >
          <Text style={styles.leaveLabel}>{t('communitySettings.leave')}</Text>
        </Pressable>

        <Pressable onPress={next} style={({ pressed }) => [styles.nextBtn, pressed && styles.nextPressed]}>
          <Text style={styles.nextLabel}>{t('communitySettings.next')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md + 2,
  },
  rowPressed: {
    backgroundColor: colors.background,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowSub: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  leaveBtn: {
    marginTop: spacing.xl + spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: 14,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  leavePressed: {
    backgroundColor: '#FDECEC',
  },
  leaveLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.error,
  },
  nextBtn: {
    alignSelf: 'flex-end',
    marginTop: spacing.xl,
    backgroundColor: '#2B2B2B',
    borderRadius: 10,
    paddingHorizontal: spacing.lg + spacing.xs,
    paddingVertical: spacing.md,
  },
  nextPressed: {
    opacity: 0.85,
  },
  nextLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
