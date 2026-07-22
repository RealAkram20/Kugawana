import { ReactNode } from 'react'
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'

interface CardProps {
  children: ReactNode
  onPress?: () => void
  style?: ViewStyle
}

export function Card({ children, onPress, style }: CardProps) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
        {children}
      </Pressable>
    )
  }

  return <View style={[styles.card, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.9,
  },
})
