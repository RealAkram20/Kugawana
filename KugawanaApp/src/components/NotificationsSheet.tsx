import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { BellOff, CheckCheck, Heart, MessageCircle, Package, ShoppingBag, X } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../constants/colors'
import { spacing } from '../constants/spacing'
import { AppNotification, notificationsService } from '../services/notifications.service'

interface Props {
  visible: boolean
  onClose: () => void
}

const ICONS: Record<string, { Icon: typeof Heart; color: string }> = {
  'community.like': { Icon: Heart, color: colors.error },
  'community.comment': { Icon: MessageCircle, color: '#2F6FED' },
  'order.requested': { Icon: ShoppingBag, color: colors.primary },
  'order.completed': { Icon: Package, color: '#0F8A6B' },
  'order.cancelled': { Icon: Package, color: colors.textSecondary },
}

/** Maps the server's `route` family onto an actual screen. */
function open(notification: AppNotification) {
  const id = notification.route_id

  if (!id) return

  if (notification.route === 'community') {
    router.push({ pathname: '/community/[id]', params: { id } })
  } else if (notification.route === 'food/shared') {
    router.push({ pathname: '/food/shared/[id]', params: { id } })
  }
}

export function NotificationsSheet({ visible, onClose }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.list(),
    enabled: visible,
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

  const handlePress = (notification: AppNotification) => {
    if (!notification.read) markRead.mutate(notification.id)
    onClose()
    open(notification)
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      {/* Tapping the dimmed area closes, the same as the X. */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.title}>{t('notifications.title')}</Text>
              <View style={styles.headerActions}>
                {hasUnread ? (
                  <Pressable hitSlop={8} onPress={() => markAllRead.mutate()} style={styles.markAll}>
                    <CheckCheck size={18} color={colors.primary} strokeWidth={2.2} />
                    <Text style={styles.markAllLabel}>{t('notifications.markAllRead')}</Text>
                  </Pressable>
                ) : null}
                <Pressable hitSlop={10} onPress={onClose}>
                  <X size={22} color={colors.textPrimary} strokeWidth={2.2} />
                </Pressable>
              </View>
            </View>

            {isLoading ? (
              <ActivityIndicator style={styles.loading} color={colors.primary} />
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={
                  <View style={styles.empty}>
                    <BellOff size={36} color={colors.textMuted} strokeWidth={1.8} />
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
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  safe: {
    flex: 1,
  },
  sheet: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    // Leaves the page visible behind it so it reads as a popup, not a screen.
    maxHeight: '75%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
