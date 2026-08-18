import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, Stack } from 'expo-router'
import {
  ArrowLeft,
  BellOff,
  CheckCheck,
  Heart,
  MessageCircle,
  Package,
  ShoppingBag,
} from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { AppNotification, notificationsService } from '../../services/notifications.service'

const ICONS: Record<string, { Icon: typeof Heart; color: string }> = {
  'community.like': { Icon: Heart, color: colors.error },
  'community.comment': { Icon: MessageCircle, color: '#2F6FED' },
  'order.requested': { Icon: ShoppingBag, color: colors.primary },
  'order.accepted': { Icon: ShoppingBag, color: '#0F8A6B' },
  'order.completed': { Icon: Package, color: '#0F8A6B' },
  'order.cancelled': { Icon: Package, color: colors.textSecondary },
}

/** Maps the server's `route` family onto an actual screen. */
function openTarget(notification: AppNotification) {
  if (notification.route === 'wallet') {
    router.push('/profile/wallet')
    return
  }

  if (notification.route === 'support') {
    router.push('/profile/help')
    return
  }

  if (notification.route === 'orders') {
    router.push('/profile/requests')
    return
  }

  const id = notification.route_id

  if (!id) return

  if (notification.route === 'community') {
    router.push({ pathname: '/community/[id]', params: { id } })
  } else if (notification.route === 'food/shared') {
    router.push({ pathname: '/food/shared/[id]', params: { id } })
  }
}

export default function NotificationsScreen() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.list(),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications'] })

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: invalidate,
  })

  const markAllRead = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: invalidate,
  })

  const notifications = data?.notifications ?? []
  const hasUnread = (data?.unread_count ?? 0) > 0

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))

  // Opening a notification marks it read, which drops it below the unread ones on
  // the next load. Anything with a target also navigates there.
  const handlePress = (notification: AppNotification) => {
    if (!notification.read) markRead.mutate(notification.id)
    openTarget(notification)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={back}>
          <ArrowLeft size={28} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
        {hasUnread ? (
          <Pressable hitSlop={8} onPress={() => markAllRead.mutate()} style={styles.markAll}>
            <CheckCheck size={18} color={colors.primary} strokeWidth={2.2} />
            <Text style={styles.markAllLabel}>{t('notifications.markAllRead')}</Text>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <BellOff size={40} color={colors.textMuted} strokeWidth={1.8} />
              <Text style={styles.emptyText}>{t('notifications.empty')}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const { Icon, color } = ICONS[item.type] ?? { Icon: Package, color: colors.textSecondary }
            return (
              <Pressable
                style={({ pressed }) => [styles.row, !item.read && styles.rowUnread, pressed && styles.rowPressed]}
                onPress={() => handlePress(item)}
              >
                <View style={[styles.iconWrap, { backgroundColor: color + '1A' }]}>
                  <Icon size={20} color={color} strokeWidth={2.2} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.rowBody} numberOfLines={2}>
                    {item.body}
                  </Text>
                  <Text style={styles.rowTime}>{item.time_ago}</Text>
                </View>
                {!item.read ? <View style={styles.unreadDot} /> : null}
              </Pressable>
            )
          }}
        />
      )}
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
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 28,
  },
  markAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  loading: {
    paddingVertical: spacing.xl,
  },
  list: {
    flexGrow: 1,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 44 + spacing.md * 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowUnread: {
    backgroundColor: '#F4F8F4',
  },
  rowPressed: {
    opacity: 0.65,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rowBody: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
  },
})
