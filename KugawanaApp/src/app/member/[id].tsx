import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, MapPin, Star } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { memberService } from '../../services/member.service'
import type { MemberProfile } from '../../types/member.types'

const demoMember: MemberProfile = {
  id: 1,
  name: 'Grace A.',
  role_label: 'Food Provider',
  profile_photo: 'https://randomuser.me/api/portraits/women/68.jpg',
  rating: 4.8,
  reviews_count: 23,
  location: 'Kampala, Uganda',
  stats: { posts: 23, shared: 18, helped: 45 },
  about: 'I love sharing food and helping my community.',
  recent_activity: [
    { id: 1, title: 'Shared Bananas', detail: '3 bunches', emoji: '🍌', time_ago: '2h ago', status: 'Active' },
  ],
}

export default function MemberProfileScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data } = useQuery({
    queryKey: ['member', id],
    queryFn: () => memberService.get(id),
    retry: false,
  })

  const member = data ?? demoMember

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
              <Text style={styles.activityEmoji}>{activity.emoji}</Text>
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
