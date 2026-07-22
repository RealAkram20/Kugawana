import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'

interface BadgeProps {
  label: string
  tone?: 'primary' | 'accent' | 'muted' | 'error'
}

export function Badge({ label, tone = 'primary' }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[tone]]}>
      <Text style={[styles.label, tone === 'muted' ? styles.labelMuted : styles.labelLight]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  accent: {
    backgroundColor: colors.accent,
  },
  muted: {
    backgroundColor: colors.border,
  },
  error: {
    backgroundColor: colors.error,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelLight: {
    color: colors.surface,
  },
  labelMuted: {
    color: colors.textSecondary,
  },
})
