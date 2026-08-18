import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router, Stack } from 'expo-router'
import { ArrowLeft, Star } from 'lucide-react-native'
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
import { memberService } from '../../services/member.service'
import { useAuthStore } from '../../stores/auth.store'
import type { MemberReview } from '../../types/member.types'

/** A row of five stars, filled up to `stars`. */
function StarRow({ stars, size }: { stars: number; size: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={size}
          color={value <= stars ? colors.accent : colors.border}
          fill={value <= stars ? colors.accent : 'transparent'}
          strokeWidth={2}
        />
      ))}
    </View>
  )
}

export default function MyReviewsScreen() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)

  // Reviews hang off the donations you made, so they are read through the same
  // member endpoint the public profile uses — pointed at yourself. The cache key
  // matches member/[id] so both screens share one copy.
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['member-reviews', String(user?.id)],
    queryFn: () => memberService.reviews(user!.id),
    enabled: Boolean(user?.id),
  })

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))

  const renderItem = ({ item }: { item: MemberReview }) => (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        {item.author_photo ? (
          <Image
            source={{ uri: item.author_photo }}
            style={styles.authorPhoto}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.authorPhoto, styles.authorFallback]}>
            <Text style={styles.authorInitial}>{item.author_name?.slice(0, 1) ?? '?'}</Text>
          </View>
        )}
        <View style={styles.cardHeadText}>
          <Text style={styles.author}>{item.author_name ?? t('myReviews.someone')}</Text>
          <StarRow stars={item.stars} size={16} />
        </View>
        <Text style={styles.time}>{item.time_ago}</Text>
      </View>
      {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
    </View>
  )

  const summary =
    data && data.reviews_count > 0 ? (
      <View style={styles.summary}>
        <Text style={styles.average}>{data.rating.toFixed(1)}</Text>
        <StarRow stars={Math.round(data.rating)} size={22} />
        <Text style={styles.summaryCount}>
          {t('member.reviews', { count: data.reviews_count })}
        </Text>
      </View>
    ) : null

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={back}>
          <ArrowLeft size={28} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('myReviews.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data?.reviews ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          ListHeaderComponent={summary}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Star size={44} color={colors.border} fill={colors.border} strokeWidth={0} />
              <Text style={styles.emptyTitle}>{t('myReviews.empty')}</Text>
              <Text style={styles.emptyHint}>{t('myReviews.emptyHint')}</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const photoSize = 44

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
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  summary: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  average: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  summaryCount: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  starRow: {
    flexDirection: 'row',
    gap: 3,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  authorPhoto: {
    width: photoSize,
    height: photoSize,
    borderRadius: photoSize / 2,
    backgroundColor: '#ECEDE7',
  },
  authorFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  cardHeadText: {
    flex: 1,
    gap: 4,
  },
  author: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  time: {
    fontSize: 14,
    color: colors.textMuted,
  },
  comment: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptyHint: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.textSecondary,
  },
})
