import { useQuery } from '@tanstack/react-query'
import { router, Stack } from 'expo-router'
import { Search } from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { CategoryPill } from '../../components/food/CategoryPill'
import { FoodCard } from '../../components/food/FoodCard'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { foodService } from '../../services/food.service'

export default function FoodBrowseScreen() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => foodService.getCategories(),
  })

  const { data: listings } = useQuery({
    queryKey: ['food', { category_id: categoryId, search }],
    queryFn: () => foodService.getListings({ category_id: categoryId, search: search || undefined }),
  })

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('food.browse') }} />
      <View style={styles.searchWrap}>
        <Search size={18} color={colors.textMuted} />
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder={t('common.search')}
          placeholderTextColor={colors.textMuted}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pills} contentContainerStyle={styles.pillsContent}>
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
      <FlatList
        data={listings ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <FoodCard food={item} onPress={() => router.push({ pathname: '/food/[id]', params: { id: String(item.id) } })} />
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
  pills: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  pillsContent: {
    paddingHorizontal: spacing.md,
  },
  list: {
    padding: spacing.md,
    paddingTop: spacing.xs,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
})
