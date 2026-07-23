import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, ChevronRight, Clock, MapPin } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../../../constants/colors'
import { availableUntilParts } from '../../../constants/datetime'
import { statusLabelKey } from '../../../constants/foodStatus'
import { spacing } from '../../../constants/spacing'
import { foodService } from '../../../services/food.service'

const AVATAR_LIMIT = 4

export default function SharedFoodDetailScreen() {
  const { t, i18n } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()
  const insets = useSafeAreaInsets()
  const foodId = Number(id)

  const { data: food, isLoading } = useQuery({
    queryKey: ['food', foodId],
    queryFn: () => foodService.getListing(foodId),
  })

  const complete = useMutation({
    mutationFn: () => foodService.completeDonation(foodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food', foodId] })
      queryClient.invalidateQueries({ queryKey: ['my-donations'] })
      Alert.alert(t('common.appName'), t('sharedFood.completed'))
    },
    onError: (error: any) =>
      Alert.alert(
        t('common.appName'),
        error.response?.data?.message ?? t('sharedFood.completeFailed'),
      ),
  })

  const confirmComplete = () =>
    Alert.alert(t('sharedFood.markCompleted'), t('sharedFood.completeConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('sharedFood.markCompleted'), onPress: () => complete.mutate() },
    ])

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/share'))

  if (isLoading || !food) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  const until = availableUntilParts(food.expiry_date, i18n.language)
  const untilLabel = until.dayKey
    ? t(`sharedFood.${until.dayKey}`, { time: until.time })
    : `${until.day}, ${until.time}`

  const interested = food.interested ?? []
  const interestedCount = food.interested_count ?? 0
  const overflow = interestedCount - Math.min(interested.length, AVATAR_LIMIT)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={back}>
          <ArrowLeft size={28} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('sharedFood.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {food.images[0] ? (
          <Image source={food.images[0]} style={styles.hero} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.hero, styles.heroFallback]}>
            <Text style={styles.heroFallbackText}>{food.title.slice(0, 1).toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.titleRow}>
          <Text style={styles.title}>{food.title}</Text>
          <Text style={styles.titleQuantity}>{food.quantity}</Text>
        </View>

        <View style={styles.iconRow}>
          <MapPin size={22} color={colors.textSecondary} strokeWidth={2} />
          <Text style={styles.iconRowText}>{food.pickup_address}</Text>
        </View>

        <View style={styles.iconRow}>
          <Clock size={22} color={colors.textSecondary} strokeWidth={2} />
          <Text style={styles.iconRowText}>
            {t('sharedFood.sharedAgo', { time: food.time_ago })}
          </Text>
          <Text style={[styles.status, !food.is_active && styles.statusInactive]}>
            {t(statusLabelKey(food))}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>{t('sharedFood.foodDetails')}</Text>
        {food.description ? <Text style={styles.description}>{food.description}</Text> : null}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('food.quantity')}</Text>
          <Text style={styles.detailValue}>{food.quantity}</Text>
        </View>

        {food.is_split ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('sharedFood.splitInto')}</Text>
            <Text style={styles.detailValue}>
              {t('sharedFood.unitsShared', {
                total: food.units_total,
                size: food.unit_quantity,
                claimed: (food.units_total ?? 0) - (food.units_available ?? 0),
              })}
            </Text>
          </View>
        ) : null}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('sharedFood.availableUntil')}</Text>
          <Text style={styles.detailValue}>{untilLabel}</Text>
        </View>

        <View style={styles.pickupBlock}>
          <View style={styles.pickupText}>
            <Text style={styles.detailLabel}>{t('sharedFood.pickupLocation')}</Text>
            <Text style={styles.pickupAddress}>{food.pickup_address}</Text>
          </View>
          <MapPin size={26} color={colors.textPrimary} strokeWidth={2} />
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>{t('sharedFood.peopleInterested')}</Text>
        {interestedCount > 0 ? (
          <Pressable
            style={styles.interestedRow}
            onPress={() => router.push({ pathname: '/food/interested/[id]', params: { id: foodId } })}
          >
            <View style={styles.avatarStack}>
              {interested.slice(0, AVATAR_LIMIT).map((person, index) => (
                <View key={person.id} style={[styles.avatarWrap, index > 0 && styles.avatarOverlap]}>
                  {person.profile_photo ? (
                    <Image source={person.profile_photo} style={styles.avatar} contentFit="cover" />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.avatarInitial}>{person.name.slice(0, 1).toUpperCase()}</Text>
                    </View>
                  )}
                </View>
              ))}
              {overflow > 0 ? (
                <View style={[styles.avatarWrap, styles.avatarOverlap]}>
                  <View style={[styles.avatar, styles.avatarMore]}>
                    <Text style={styles.avatarMoreText}>{overflow}+</Text>
                  </View>
                </View>
              ) : null}
            </View>
            <ChevronRight size={26} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
        ) : (
          <Text style={styles.noInterest}>{t('sharedFood.noInterest')}</Text>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <Pressable
          style={({ pressed }) => [styles.action, styles.editBtn, pressed && styles.pressed]}
          onPress={() => router.push({ pathname: '/food/edit/[id]', params: { id: foodId } })}
        >
          <Text style={styles.editLabel} numberOfLines={1}>{t('sharedFood.edit')}</Text>
        </Pressable>
        <Pressable
          disabled={!food.can_complete || complete.isPending}
          style={({ pressed }) => [
            styles.action,
            styles.completeBtn,
            pressed && styles.pressed,
            !food.can_complete && styles.actionDisabled,
          ]}
          onPress={confirmComplete}
        >
          {complete.isPending ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.completeLabel} numberOfLines={2}>{t('sharedFood.markCompleted')}</Text>
          )}
        </Pressable>
      </View>
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
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.background,
    marginTop: spacing.sm,
  },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  heroFallbackText: {
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
    fontSize: 18,
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
    color: colors.primary,
  },
  statusInactive: {
    color: colors.textMuted,
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
  pickupBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  pickupText: {
    flex: 1,
    gap: spacing.sm,
  },
  pickupAddress: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  interestedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatarOverlap: {
    marginLeft: -12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
  },
  avatarMore: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE8E0',
  },
  avatarMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  noInterest: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: spacing.md,
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
    minHeight: 58,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  editLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  completeBtn: {
    backgroundColor: colors.primary,
  },
  completeLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.surface,
    textAlign: 'center',
  },
  actionDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.9,
  },
})
