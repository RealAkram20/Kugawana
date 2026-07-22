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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  active: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.surface,
  },
})
