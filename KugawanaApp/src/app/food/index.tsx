import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router, Stack } from 'expo-router'
import { Search } from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native'
import { CartButton } from '../../components/CartButton'
import { CategoryPill } from '../../components/food/CategoryPill'
import { FoodCard } from '../../components/food/FoodCard'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { foodService } from '../../services/food.service'

const COLUMNS = 2
const SUGGESTION_LIMIT = 3

export default function FoodBrowseScreen() {
  const { t } = useTranslation()
  const { width } = useWindowDimensions()
  const [search, setSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)

  // Fetch on a pause in typing rather than on every keystroke.
  const debouncedSearch = useDebouncedValue(search.trim(), 250)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => foodService.getCategories(),
  })

  const { data: listings } = useQuery({
    queryKey: ['food', { category_id: categoryId, search: debouncedSearch }],
    queryFn: () =>
      foodService.getListings({ category_id: categoryId, search: debouncedSearch || undefined }),
  })

  const suggestions = (listings ?? []).slice(0, SUGGESTION_LIMIT)
  const suggestionsVisible = showSuggestions && debouncedSearch.length > 0 && suggestions.length > 0

  const openListing = (id: number) => {
    setShowSuggestions(false)
    Keyboard.dismiss()
    router.push({ pathname: '/food/[id]', params: { id: String(id) } })
  }

  // Explicit width rather than flex, so a lone card on the last row stays
  // half-width instead of stretching across it.
  const cardWidth = (width - spacing.md * (COLUMNS + 1)) / COLUMNS

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ headerShown: true, title: t('food.browse'), headerRight: () => <CartButton /> }}
      />
      <View style={styles.searchSection}>
        <View style={styles.searchWrap}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={styles.search}
            value={search}
            onChangeText={(text) => {
              setSearch(text)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            returnKeyType="search"
            onSubmitEditing={() => setShowSuggestions(false)}
            placeholder={t('common.search')}
            placeholderTextColor={colors.textMuted}
          />
        </View>
        {suggestionsVisible ? (
          <View style={styles.suggestions}>
            {suggestions.map((item, index) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.suggestionRow,
                  index > 0 && styles.suggestionDivider,
                  pressed && styles.suggestionPressed,
                ]}
                onPress={() => openListing(item.id)}
              >
                {item.images[0] ? (
                  <Image source={item.images[0]} style={styles.suggestionThumb} contentFit="cover" />
                ) : (
                  <View style={[styles.suggestionThumb, styles.suggestionThumbFallback]}>
                    <Text style={styles.suggestionThumbText}>{item.title.slice(0, 1).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.suggestionText}>
                  <Text style={styles.suggestionTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.suggestionMeta} numberOfLines={1}>{item.quantity}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
      <View style={styles.pills}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsContent}
        >
          <CategoryPill label={t('orders.all')} active={categoryId == null} onPress={() => setCategoryId(undefined)} />
          {(categories ?? []).map((category) => (
            <CategoryPill
              key={category.id}
              label={category.name}
              active={categoryId === category.id}
              onPress={() => setCategoryId(category.id)}
            />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={listings ?? []}
        keyExtractor={(item) => String(item.id)}
        style={styles.list}
        numColumns={COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <FoodCard
            food={item}
            style={{ width: cardWidth }}
            onPress={() => router.push({ pathname: '/food/[id]', params: { id: String(item.id) } })}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>{t('home.empty')}</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchSection: {
    zIndex: 10,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  search: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  suggestions: {
    marginHorizontal: spacing.md,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  suggestionDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  suggestionPressed: {
    backgroundColor: colors.background,
  },
  suggestionThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  suggestionThumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  suggestionThumbText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  suggestionMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  pills: {
    // The row sizes to its own content and never shrinks, so the pills below
    // the search bar can't be clipped by the list claiming the space.
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: spacing.sm,
  },
  pillsContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  row: {
    gap: spacing.md,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
})
