import { useQuery } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { ordersService } from '../../services/orders.service'
import type { OrderStatus } from '../../types/order.types'

type Filter = 'all' | OrderStatus

export default function MyRequestsScreen() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<Filter>('all')

  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersService.myOrders(),
  })

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: t('orders.all') },
    { key: 'pending', label: t('orders.pending') },
    { key: 'accepted', label: t('orders.accepted') },
    { key: 'completed', label: t('orders.completed') },
  ]

  const filtered = (orders ?? []).filter((order) => filter === 'all' || order.status === filter)

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('profile.myRequests') }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setFilter(tab.key)}
            style={[styles.tab, filter === tab.key && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, filter === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.left}>
                <Text style={styles.title}>{item.food?.title ?? ''}</Text>
                <Text style={styles.meta}>
                  {item.points_spent} {t('common.points')} · {item.delivery_method === 'pickup' ? t('food.pickup') : t('food.delivery')}
                </Text>
              </View>
              <Badge
                label={item.status}
                tone={item.status === 'completed' ? 'primary' : item.status === 'cancelled' ? 'error' : 'muted'}
              />
            </View>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{t('orders.empty')}</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    flexGrow: 0,
    marginTop: spacing.md,
  },
  tabsContent: {
    paddingHorizontal: spacing.md,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.surface,
  },
  list: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  left: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
})
