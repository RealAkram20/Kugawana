import { useQuery } from '@tanstack/react-query'
import { router, Stack } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ListingCard } from '../../components/ui/ListingCard'
import { UnderlineTabs } from '../../components/ui/UnderlineTabs'
import { colors } from '../../constants/colors'
import { statusLabelKey, statusTone } from '../../constants/foodStatus'
import { spacing } from '../../constants/spacing'
import { foodService } from '../../services/food.service'
import type { FoodListing } from '../../types/food.types'

type Tab = 'all' | 'active' | 'completed'

const TABS: Tab[] = ['all', 'active', 'completed']

export default function MySharedFoodScreen() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('all')

  const { data: donations, isRefetching, refetch } = useQuery({
    queryKey: ['my-donations'],
    queryFn: () => foodService.myDonations(),
  })

  // The list is a user's own donations, so it stays small enough to filter
  // on the client and keep tab switching instant.
  const visible = useMemo(() => {
    const all = donations ?? []
    if (tab === 'active') return all.filter((item) => item.is_active)
    if (tab === 'completed') return all.filter((item) => item.status === 'completed')
    return all
  }, [donations, tab])

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))

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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={back}>
          <ArrowLeft size={28} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('profile.sharedFood')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <UnderlineTabs
        tabs={TABS.map((key) => ({ key, label: t(`sharedFood.tabs.${key}`) }))}
        value={tab}
        onChange={setTab}
      />

      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={<Text style={styles.empty}>{t(`sharedFood.empty.${tab}`)}</Text>}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 28,
  },
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
