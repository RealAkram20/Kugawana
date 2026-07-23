import { Check, Search, X } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../constants/colors'
import { Country, flagEmoji, searchCountries } from '../constants/countries'
import { spacing } from '../constants/spacing'

interface Props {
  visible: boolean
  selected: Country
  onSelect: (country: Country) => void
  onClose: () => void
}

export function CountryPicker({ visible, selected, onSelect, onClose }: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchCountries(query), [query])

  const close = () => {
    setQuery('')
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close} presentationStyle="pageSheet">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('auth.selectCountry')}</Text>
          <Pressable onPress={close} hitSlop={12} style={styles.close}>
            <X size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.searchField}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={t('auth.searchCountry')}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => item.iso}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={20}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t('auth.noCountryMatch')}</Text>}
          renderItem={({ item }) => {
            const active = item.iso === selected.iso
            return (
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => {
                  onSelect(item)
                  close()
                }}
              >
                <Text style={styles.flag}>{flagEmoji(item.iso)}</Text>
                <Text style={[styles.name, active && styles.nameActive]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.dial}>+{item.dial}</Text>
                {active ? <Check size={18} color={colors.primary} strokeWidth={3} /> : null}
              </Pressable>
            )
          }}
        />
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  close: {
    position: 'absolute',
    right: spacing.lg,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    opacity: 0.6,
  },
  flag: {
    fontSize: 22,
  },
  name: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  nameActive: {
    fontWeight: '700',
    color: colors.primary,
  },
  dial: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  empty: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingVertical: spacing.xl,
    fontSize: 15,
  },
})
