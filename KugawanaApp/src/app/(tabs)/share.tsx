import { router } from 'expo-router'
import { Plus } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SharedFoodList } from '../../components/food/SharedFoodList'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'

export default function MySharedFoodTab() {
  const { t } = useTranslation()

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>{t('sharedFood.title')}</Text>

      {/* Clears the floating button and the tab bar beneath it. */}
      <SharedFoodList bottomInset={120} />

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push('/food/create')}
        accessibilityRole="button"
        accessibilityLabel={t('share.title')}
      >
        <Plus size={32} color={colors.surface} strokeWidth={2.5} />
      </Pressable>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabPressed: {
    opacity: 0.9,
  },
})
