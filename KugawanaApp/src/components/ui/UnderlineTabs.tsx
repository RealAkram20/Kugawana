import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'

interface UnderlineTabsProps<T extends string> {
  tabs: { key: T; label: string }[]
  value: T
  onChange: (key: T) => void
}

/** Full-width tab strip with a green underline marking the active tab. */
export function UnderlineTabs<T extends string>({ tabs, value, onChange }: UnderlineTabsProps<T>) {
  return (
    <View style={styles.tabs}>
      {tabs.map((tab) => {
        const active = tab.key === value
        return (
          <Pressable key={tab.key} style={styles.tab} onPress={() => onChange(tab.key)}>
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {tab.label}
            </Text>
            <View style={[styles.underline, active && styles.underlineActive]} />
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  labelActive: {
    color: colors.primary,
  },
  underline: {
    height: 3,
    alignSelf: 'stretch',
    marginHorizontal: spacing.sm,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  underlineActive: {
    backgroundColor: colors.primary,
  },
})
