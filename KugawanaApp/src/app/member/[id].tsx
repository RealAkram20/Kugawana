import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, MapPin, Star } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CategoryIcon } from '../../components/ui/CategoryIcon'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { memberService } from '../../services/member.service'

export default function MemberProfileScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: () => memberService.get(id),
  })

  const { data: reviews } = useQuery({
    queryKey: ['member-reviews', id],
    queryFn: () => memberService.reviews(id),
  })

  if (isLoading || !member) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          hitSlop={12}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/community'))}
        >
          <ArrowLeft size={26} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('member.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          {member.profile_photo ? (
            <Image
              source={{ uri: member.profile_photo }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{member.name.slice(0, 1)}</Text>
            </View>
          )}

          <Text style={styles.name}>{member.name}</Text>
          <Text style={styles.role}>{member.role_label}</Text>

          <View style={styles.ratingRow}>
            <Star size={20} color={colors.accent} fill={colors.accent} strokeWidth={0} />
            <Text style={styles.rating}>{member.rating.toFixed(1)}</Text>
            <Text style={styles.reviews}>
              ({member.reviews_count} {t('member.reviews')})
            </Text>
          </View>

          {!!member.location && (
            <View style={styles.locationRow}>
              <MapPin size={16} color={colors.textSecondary} strokeWidth={2} />
              <Text style={styles.location}>{member.location}</Text>
            </View>
          )}
        </View>

        <View style={styles.stats}>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{member.stats.posts}</Text>
            <Text style={styles.statLabel}>{t('member.posts')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{member.stats.shared}</Text>
            <Text style={styles.statLabel}>{t('member.shared')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{member.stats.helped}</Text>
            <Text style={styles.statLabel}>{t('member.helped')}</Text>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {!!member.about && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('member.about')}</Text>
            <Text style={styles.about}>{member.about}</Text>
          </View>
        )}

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('member.recentActivity')}</Text>
          {member.recent_activity.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <CategoryIcon slug={activity.category_icon} />
              <View style={styles.activityText}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDetail}>{activity.detail}</Text>
              </View>
              <View style={styles.activityMeta}>
                <Text style={styles.activityTime}>{activity.time_ago}</Text>
                <Text style={styles.activityStatus}>{activity.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {reviews && reviews.reviews_count > 0 ? (
          <>
            <View style={styles.sectionDivider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('member.reviews', { count: reviews.reviews_count })}
              </Text>
              {reviews.reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHead}>
                    <Text style={styles.reviewAuthor}>{review.author_name}</Text>
                    <Text style={styles.reviewTime}>{review.time_ago}</Text>
                  </View>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star
                        key={value}
                        size={16}
                        color={value <= review.stars ? colors.accent : colors.border}
                        fill={value <= review.stars ? colors.accent : 'transparent'}
                        strokeWidth={2}
                      />
                    ))}
                  </View>
                  {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const avatarSize = 132

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
  reviewCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: 6,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewAuthor: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reviewTime: {
    fontSize: 14,
    color: colors.textMuted,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 3,
  },
  reviewComment: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 26,
  },
  container: {
    paddingBottom: spacing.xl,
  },
  identity: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  avatar: {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    backgroundColor: '#ECEDE7',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  role: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  rating: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reviews: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  location: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  about: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
  },
  activityEmoji: {
    fontSize: 34,
  },
  activityText: {
    flex: 1,
    gap: 3,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  activityDetail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  activityMeta: {
    alignItems: 'flex-end',
    gap: 3,
  },
  activityTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  activityStatus: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
})
