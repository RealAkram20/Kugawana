import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, RefreshControl, StyleSheet, Text } from 'react-native'
import { colors } from '../../constants/colors'
import { statusLabelKey, statusTone } from '../../constants/foodStatus'
import { spacing } from '../../constants/spacing'
import { foodService } from '../../services/food.service'
import type { FoodListing } from '../../types/food.types'
import { ListingCard } from '../ui/ListingCard'
import { UnderlineTabs } from '../ui/UnderlineTabs'

type Tab = 'all' | 'active' | 'completed'

const TABS: Tab[] = ['all', 'active', 'completed']

interface SharedFoodListProps {
  /** Extra bottom padding for screens that float a button over the list. */
  bottomInset?: number
}

/**
 * The signed-in user's own donations, with the status tabs. Shared by the
 * Share tab and the Profile entry so both always show the same thing.
 */
export function SharedFoodList({ bottomInset = 0 }: SharedFoodListProps) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('all')

  const { data: donations, isRefetching, refetch } = useQuery({
    queryKey: ['my-donations'],
    queryFn: () => foodService.myDonations(),
  })

  // A user's own donations stay small enough to filter on the client, which
  // keeps tab switching instant.
  const visible = useMemo(() => {
    const all = donations ?? []
    if (tab === 'active') return all.filter((item) => item.is_active)
    if (tab === 'completed') return all.filter((item) => item.status === 'completed')
    return all
  }, [donations, tab])

  const renderItem = ({ item }: { item: FoodListing }) => (
    <ListingCard
      image={item.images[0] ?? null}
      title={item.title}
      subtitle={item.quantity}
      location={item.pickup_address}
      time={item.time_ago}
      statusLabel={t(statusLabelKey(item))}
      tone={statusTone(item)}
      onPress={() => router.push({ pathname: '/food/shared/[id]', params: { id: item.id } })}
    />
  )

  return (
    <>
      <UnderlineTabs
        tabs={TABS.map((key) => ({ key, label: t(`sharedFood.tabs.${key}`) }))}
        value={tab}
        onChange={setTab}
      />

      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, { paddingBottom: spacing.md + bottomInset }]}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={<Text style={styles.empty}>{t(`sharedFood.empty.${tab}`)}</Text>}
        showsVerticalScrollIndicator={false}
      />
    </>
  )
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
    gap: spacing.md,
    flexGrow: 1,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
})
