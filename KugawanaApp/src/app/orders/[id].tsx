import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, CalendarClock, MapPin, Star } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../constants/colors'
import { availableUntilParts } from '../../constants/datetime'
import { spacing } from '../../constants/spacing'
import { ordersService } from '../../services/orders.service'
import type { OrderStatus } from '../../types/order.types'

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: colors.warning,
  accepted: colors.primary,
  completed: colors.primary,
  cancelled: colors.error,
}

export default function RequestDetailScreen() {
  const { t, i18n } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()
  const orderId = Number(id)

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersService.getOrder(orderId),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['order', orderId] })
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    queryClient.invalidateQueries({ queryKey: ['wallet'] })
  }

  const cancel = useMutation({
    mutationFn: () => ordersService.cancelOrder(orderId),
    onSuccess: () => {
      invalidate()
      Alert.alert(t('common.appName'), t('requestDetail.cancelled'))
      back()
    },
    onError: (error: any) =>
      Alert.alert(t('common.appName'), error.response?.data?.message ?? t('requestDetail.cancelFailed')),
  })

  const confirmCancel = () =>
    Alert.alert(t('requestDetail.cancelRequest'), t('requestDetail.cancelConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('requestDetail.cancelRequest'), style: 'destructive', onPress: () => cancel.mutate() },
    ])

  const back = () => (router.canGoBack() ? router.back() : router.replace('/profile/requests'))

  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  const formatWhen = (iso: string | null) => {
    if (!iso) return t('requestDetail.notSet')
    const parts = availableUntilParts(iso, i18n.language)
    return parts.dayKey
      ? t(`sharedFood.${parts.dayKey}`, { time: parts.time })
      : `${parts.day}, ${parts.time}`
  }

  const quantity = order.preferred_quantity ?? order.food?.quantity ?? ''

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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {order.food?.images?.[0] ? (
          <Image source={order.food.images[0]} style={styles.hero} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.hero, styles.heroFallback]}>
            <Text style={styles.heroInitial}>{(order.food?.title ?? '?').slice(0, 1).toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.titleRow}>
          <Text style={styles.title}>{order.food?.title ?? ''}</Text>
          <Text style={styles.titleQuantity}>{quantity}</Text>
        </View>

        <View style={styles.iconRow}>
          <MapPin size={22} color={colors.textSecondary} strokeWidth={2} />
          <Text style={styles.iconRowText}>{order.food?.pickup_address ?? ''}</Text>
        </View>

        <View style={styles.iconRow}>
          <CalendarClock size={22} color={colors.textSecondary} strokeWidth={2} />
          <Text style={styles.iconRowText}>
            {t('requestDetail.requestedAgo', { time: order.time_ago })}
          </Text>
          <Text style={[styles.status, { color: STATUS_COLOR[order.status] }]}>
            {t(`orders.${order.status}`)}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>{t('requestDetail.title')}</Text>
        {order.notes ? <Text style={styles.description}>{order.notes}</Text> : null}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('requestDetail.preferredQuantity')}</Text>
          <Text style={styles.detailValue}>{quantity}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('requestDetail.needBy')}</Text>
          <Text style={styles.detailValue}>{formatWhen(order.need_by)}</Text>
        </View>

        <View style={styles.notesBlock}>
          <Text style={styles.detailLabel}>{t('requestDetail.specialNotes')}</Text>
          <Text style={styles.notesValue}>{order.notes ?? t('requestDetail.noNotes')}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>{t('requestDetail.requester')}</Text>
        {order.requester ? (
          <View style={styles.requesterRow}>
            {order.requester.profile_photo ? (
              <Image source={order.requester.profile_photo} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {order.requester.name.slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.requesterName}>{order.requester.name}</Text>
            <Pressable
              hitSlop={8}
              onPress={() =>
                router.push({ pathname: '/member/[id]', params: { id: order.requester!.id } })
              }
            >
              <Text style={styles.viewProfile}>{t('requestDetail.viewProfile')}</Text>
            </Pressable>
          </View>
        ) : null}

        {order.my_rating ? (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>{t('rate.yourRating')}</Text>
            <View style={styles.myRatingRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Star
                  key={value}
                  size={22}
                  color={value <= order.my_rating!.stars ? colors.accent : colors.border}
                  fill={value <= order.my_rating!.stars ? colors.accent : 'transparent'}
                  strokeWidth={2}
                />
              ))}
            </View>
            {order.my_rating.comment ? (
              <Text style={styles.myRatingComment}>{order.my_rating.comment}</Text>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      {order.can_rate ? (
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.action, styles.editBtn, pressed && styles.pressed]}
            onPress={() => router.push({ pathname: '/orders/rate/[id]', params: { id: orderId } })}
          >
            <Text style={styles.editLabel}>{t('rate.rateProvider')}</Text>
          </Pressable>
        </View>
      ) : null}

      {order.can_cancel || order.can_edit ? (
        <View style={styles.footer}>
          {order.can_cancel ? (
            <Pressable
              disabled={cancel.isPending}
              style={({ pressed }) => [styles.action, styles.cancelBtn, pressed && styles.pressed]}
              onPress={confirmCancel}
            >
              {cancel.isPending ? (
                <ActivityIndicator color={colors.error} />
              ) : (
                <Text style={styles.cancelLabel}>{t('requestDetail.cancelRequest')}</Text>
              )}
            </Pressable>
          ) : null}
          {order.can_edit ? (
            <Pressable
              style={({ pressed }) => [styles.action, styles.editBtn, pressed && styles.pressed]}
              onPress={() => router.push({ pathname: '/orders/edit/[id]', params: { id: orderId } })}
            >
              <Text style={styles.editLabel}>{t('requestDetail.editRequest')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  hero: {
    width: '100%',
    height: 190,
    borderRadius: 12,
    backgroundColor: colors.background,
    marginTop: spacing.sm,
  },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  heroInitial: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.surface,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  titleQuantity: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  iconRowText: {
    flex: 1,
    fontSize: 17,
    color: colors.textSecondary,
  },
  status: {
    fontSize: 17,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  detailLabel: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  notesBlock: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  notesValue: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  requesterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
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
  requesterName: {
    flex: 1,
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  viewProfile: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
  },
  myRatingRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.md,
  },
  myRatingComment: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  action: {
    flex: 1,
    height: 58,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: colors.error,
    backgroundColor: colors.surface,
  },
  cancelLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.error,
  },
  editBtn: {
    backgroundColor: colors.primary,
  },
  editLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.surface,
  },
  pressed: {
    opacity: 0.9,
  },
})
