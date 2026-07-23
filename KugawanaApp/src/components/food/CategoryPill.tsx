import { Pressable, StyleSheet, Text } from 'react-native'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'

interface CategoryPillProps {
  label: string
  active: boolean
  onPress: () => void
}

export function CategoryPill({ label, active, onPress }: CategoryPillProps) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.active]}>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pill: {
    height: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: 21,
    backgroundColor: '#F2F2EF',
    marginRight: spacing.sm,
  },
  active: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  labelActive: {
    color: colors.surface,
  },
})
