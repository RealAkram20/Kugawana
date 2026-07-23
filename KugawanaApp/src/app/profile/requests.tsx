import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router, Stack } from 'expo-router'
import { ArrowLeft, MessageCircle, Star } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ListingCard, type StatusTone } from '../../components/ui/ListingCard'
import { UnderlineTabs } from '../../components/ui/UnderlineTabs'
import { colors } from '../../constants/colors'
import { availableUntilParts } from '../../constants/datetime'
import { spacing } from '../../constants/spacing'
import { ordersService } from '../../services/orders.service'
import type { Order, OrderStatus } from '../../types/order.types'

type Tab = 'all' | Extract<OrderStatus, 'pending' | 'accepted' | 'completed'>

const TABS: Tab[] = ['all', 'pending', 'accepted', 'completed']

const TONES: Record<OrderStatus, StatusTone> = {
  pending: 'warning',
  accepted: 'positive',
  completed: 'positive',
  cancelled: 'negative',
}

export default function MyRequestsScreen() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { data: orders, isRefetching, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersService.myOrders(),
  })

  const visible = useMemo(
    () => (orders ?? []).filter((order) => tab === 'all' || order.status === tab),
    [orders, tab],
  )

  // On the Accepted tab, open the first request so its pickup details are
  // visible without a tap. Every other tab starts collapsed — mixed lists read
  // as a scannable index, not one expanded row among many.
  useEffect(() => {
    if (tab !== 'accepted') {
      setExpandedId(null)
      return
    }
    setExpandedId(visible.find((order) => order.status === 'accepted')?.id ?? null)
  }, [tab, orders])

  const complete = useMutation({
    mutationFn: (orderId: number) => ordersService.completeOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      Alert.alert(t('common.appName'), t('orders.completedToast'))
    },
    onError: (error: any) =>
      Alert.alert(t('common.appName'), error.response?.data?.message ?? t('orders.completeFailed')),
  })

  const confirmComplete = (order: Order) =>
    Alert.alert(t('orders.markCompleted'), t('orders.completeConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('orders.markCompleted'), onPress: () => complete.mutate(order.id) },
    ])

  const contactProvider = async (order: Order) => {
    const provider = order.provider
    if (!provider) return

    const whatsapp = provider.whatsapp_number
      ? `whatsapp://send?phone=${provider.whatsapp_number}`
      : null

    if (whatsapp && (await Linking.canOpenURL(whatsapp))) {
      Linking.openURL(whatsapp)
      return
    }
    if (provider.contact_number) {
      Linking.openURL(`sms:${provider.contact_number}`)
      return
    }
    Alert.alert(t('common.appName'), t('orders.noContact'))
  }

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))

  const pickupLabel = (order: Order) => {
    if (!order.scheduled_pickup_at) return t('orders.pickupNotSet')
    const parts = availableUntilParts(order.scheduled_pickup_at, i18n.language)
    return parts.dayKey
      ? t(`sharedFood.${parts.dayKey}`, { time: parts.time })
      : `${parts.day}, ${parts.time}`
  }

  const renderProvider = (order: Order) => {
    const provider = order.provider
    if (!provider) return null
    const canContact = Boolean(provider.whatsapp_number || provider.contact_number)

    return (
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{t('orders.provider')}</Text>

        <View style={styles.providerRow}>
          <Pressable
            hitSlop={6}
            onPress={() => router.push({ pathname: '/member/[id]', params: { id: provider.id } })}
          >
            {provider.profile_photo ? (
              <Image source={provider.profile_photo} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{provider.name.slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{provider.name}</Text>
            {provider.reviews_count > 0 ? (
              <View style={styles.ratingRow}>
                <Star size={20} color={colors.accent} fill={colors.accent} />
                <Text style={styles.ratingValue}>{provider.rating.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({provider.reviews_count})</Text>
              </View>
            ) : (
              <Text style={styles.noRating}>{t('orders.noRatings')}</Text>
            )}
          </View>

          {canContact ? (
            <Pressable
              style={({ pressed }) => [styles.messageBtn, pressed && styles.pressed]}
              onPress={() => contactProvider(order)}
            >
              <MessageCircle size={26} color={colors.primary} strokeWidth={2} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.panelDivider} />

        <Text style={styles.pickupLabel}>{t('orders.scheduledPickup')}</Text>
        <Text style={styles.pickupValue}>{pickupLabel(order)}</Text>

        {order.can_complete ? (
          <Pressable
            disabled={complete.isPending}
            style={({ pressed }) => [styles.completeBtn, pressed && styles.pressed]}
            onPress={() => confirmComplete(order)}
          >
            {complete.isPending ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.completeLabel}>{t('orders.markCompleted')}</Text>
            )}
          </Pressable>
        ) : null}
      </View>
    )
  }

  const renderItem = ({ item }: { item: Order }) => {
    const expandable = item.status === 'accepted' && item.provider !== null
    const expanded = expandable && expandedId === item.id

    return (
      <View style={[styles.group, expanded && styles.groupExpanded]}>
        <ListingCard
          flat
          image={item.food?.images?.[0] ?? null}
          title={item.food?.title ?? ''}
          subtitle={item.food?.quantity ?? ''}
          location={item.food?.pickup_address ?? null}
          time={item.time_ago}
          statusLabel={t(`orders.${item.status}`)}
          tone={TONES[item.status]}
          onPress={() => {
            if (expandable) {
              setExpandedId(expanded ? null : item.id)
            } else {
              router.push({ pathname: '/orders/[id]', params: { id: item.id } })
            }
          }}
        />
        {expanded ? renderProvider(item) : null}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={back}>
          <ArrowLeft size={28} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('profile.myRequests')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <UnderlineTabs
        tabs={TABS.map((key) => ({ key, label: t(`orders.${key}`) }))}
        value={tab}
        onChange={setTab}
      />

      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={<Text style={styles.empty}>{t(`orders.none.${tab}`)}</Text>}
        ListFooterComponent={
          visible.length > 0 ? <Text style={styles.noMore}>{t(`orders.noMore.${tab}`)}</Text> : null
        }
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
  group: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  groupExpanded: {
    backgroundColor: '#FAFAF8',
  },
  panel: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  panelTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.background,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.surface,
  },
  providerInfo: {
    flex: 1,
    gap: 4,
  },
  providerName: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ratingValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ratingCount: {
    fontSize: 17,
    color: colors.textSecondary,
  },
  noRating: {
    fontSize: 15,
    color: colors.textMuted,
  },
  messageBtn: {
    width: 62,
    height: 62,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.md,
  },
  pickupLabel: {
    fontSize: 17,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  pickupValue: {
    fontSize: 17,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  completeBtn: {
    height: 58,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  completeLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.surface,
  },
  pressed: {
    opacity: 0.9,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  noMore: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.textSecondary,
    paddingVertical: spacing.lg,
  },
})
