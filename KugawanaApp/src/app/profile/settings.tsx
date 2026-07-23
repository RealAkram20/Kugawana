import Constants from 'expo-constants'
import { router, Stack } from 'expo-router'
import { Bell, ChevronRight, Info, Lock, SlidersHorizontal, UserCog, Users } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'

export default function SettingsScreen() {
  const { t } = useTranslation()
  const comingSoon = () => Alert.alert(t('common.appName'), t('common.comingSoon'))

  type Row = { label: string; Icon: typeof Bell; color: string; onPress: () => void }

  const groups: { title: string; rows: Row[] }[] = [
    {
      title: t('profile.account'),
      rows: [
        {
          label: t('profile.editProfile'),
          Icon: UserCog,
          color: colors.primary,
          onPress: () => router.push('/profile/edit'),
        },
        { label: t('profile.privacy'), Icon: Lock, color: '#2F6FED', onPress: comingSoon },
      ],
    },
    {
      title: t('profile.preferences'),
      rows: [
        { label: t('profile.notifications'), Icon: Bell, color: colors.accent, onPress: comingSoon },
        {
          label: t('communitySettings.title'),
          Icon: Users,
          color: '#0F8A6B',
          onPress: () => router.push('/community/settings'),
        },
        { label: t('profile.language'), Icon: SlidersHorizontal, color: '#7C3AED', onPress: comingSoon },
      ],
    },
  ]

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('profile.settingsTitle') }} />
      <ScrollView contentContainerStyle={styles.content}>
        {groups.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.card}>
              {group.rows.map((row, index) => (
                <Pressable
                  key={row.label}
                  onPress={row.onPress}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <row.Icon size={22} color={row.color} strokeWidth={2} />
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <ChevronRight size={20} color={colors.textMuted} strokeWidth={2} />
                  {index < group.rows.length - 1 && <View style={styles.divider} />}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.group}>
          <Text style={styles.groupTitle}>{t('profile.about')}</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Info size={22} color={colors.textSecondary} strokeWidth={2} />
              <Text style={styles.rowLabel}>{t('profile.version')}</Text>
              <Text style={styles.rowValue}>
                {Constants.expoConfig?.version ?? '1.0.0'}
              </Text>
            </View>
          </View>
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
  group: {
    marginBottom: spacing.lg,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
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
  rowValue: {
    fontSize: 15,
    color: colors.textMuted,
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
