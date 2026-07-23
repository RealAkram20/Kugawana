import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import {
  Bell,
  BookOpen,
  Ellipsis,
  Heart,
  MapPin,
  Menu,
  MessageCircle,
  Salad,
  CirclePlus,
  Search,
  Users,
} from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CategoryIcon } from '../../components/ui/CategoryIcon'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { communityService } from '../../services/community.service'
import { foodService } from '../../services/food.service'
import { learnService } from '../../services/learn.service'
import { useAuthStore } from '../../stores/auth.store'

const QUICK_ACTIONS = [
  { key: 'find', icon: Salad, color: '#2D6A2D', route: '/food' as const },
  { key: 'share', icon: CirclePlus, color: '#F5A623', route: '/(tabs)/share' as const },
  { key: 'learn', icon: BookOpen, color: '#4285F4', route: '/learn' as const },
  { key: 'community', icon: Users, color: '#7B4FD8', route: '/(tabs)/community' as const },
]

export default function HomeScreen() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const { data: listings, isRefetching, refetch } = useQuery({
    queryKey: ['food'],
    queryFn: () => foodService.getListings(),
  })

  const { data: posts } = useQuery({
    queryKey: ['community'],
    queryFn: () => communityService.feed(),
  })

  const { data: articles } = useQuery({
    queryKey: ['learn'],
    queryFn: () => learnService.articles(),
  })

  const latestPost = posts?.[0]
  const latestArticle = articles?.[0]

  const firstName = user?.name?.split(' ')[0] ?? ''
  const actionLabels: Record<string, string> = {
    find: t('home.findFood'),
    share: t('home.shareFood'),
    learn: t('home.learn'),
    community: t('home.community'),
  }

  const nearby = (listings ?? []).slice(0, 3)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable hitSlop={8}>
            <Menu size={26} color={colors.textPrimary} strokeWidth={2.2} />
          </Pressable>
          <Pressable hitSlop={8} style={styles.bellWrap}>
            <Bell size={24} color={colors.textPrimary} strokeWidth={2.2} />
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>3</Text>
            </View>
          </Pressable>
        </View>

        <Text style={styles.greeting}>
          {t('home.greeting')}, {firstName}
        </Text>
        <View style={styles.locationRow}>
          <MapPin size={18} color={colors.textPrimary} strokeWidth={2.2} />
          <Text style={styles.locationText}>{user?.district ?? ''}</Text>
        </View>

        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('home.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
          />
          <Search size={22} color={colors.textPrimary} strokeWidth={2.2} />
        </View>

        <View style={styles.actionsRow}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable key={action.key} style={styles.actionItem} onPress={() => router.push(action.route)}>
              <View style={[styles.actionTile, { backgroundColor: action.color }]}>
                <action.icon size={30} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text style={styles.actionLabel}>{actionLabels[action.key]}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t('home.nearbyFood')}</Text>
          <Pressable onPress={() => router.push('/food')}>
            <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
          </Pressable>
        </View>
        {nearby.length > 0 ? (
          <View style={styles.foodRow}>
            {nearby.map((item) => (
              <Pressable
                key={item.id}
                style={styles.foodCard}
                onPress={() => router.push({ pathname: '/food/[id]', params: { id: item.id } })}
              >
                <View style={styles.foodImage}>
                  {item.images?.[0] ? (
                    <Image source={item.images[0]} style={styles.foodPhoto} contentFit="cover" transition={150} />
                  ) : (
                    <CategoryIcon slug={item.category_icon} size={28} />
                  )}
                </View>
                <Text style={styles.foodTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.foodMeta} numberOfLines={1}>
                  {item.pickup_address ?? ''}
                </Text>
                <Text style={styles.foodMeta} numberOfLines={1}>
                  {item.quantity}
                </Text>
                <View style={styles.freshRow}>
                  <View style={styles.freshDot} />
                  <Text style={styles.freshText}>{t('home.fresh')}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.sectionEmpty}>{t('home.noNearbyFood')}</Text>
        )}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t('home.recentPosts')}</Text>
          <Pressable onPress={() => router.push('/(tabs)/community')}>
            <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
          </Pressable>
        </View>
        {latestPost ? (
          <Pressable
            style={styles.postCard}
            onPress={() => router.push({ pathname: '/community/[id]', params: { id: latestPost.id } })}
          >
            <View style={styles.postHeader}>
              {latestPost.profile_photo ? (
                <Image source={latestPost.profile_photo} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {latestPost.author_name?.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.postHeaderText}>
                <Text style={styles.postAuthor}>{latestPost.author_name}</Text>
                <Text style={styles.postMeta}>{latestPost.time_ago}</Text>
              </View>
              <Ellipsis size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.postBody}>
              <Text style={styles.postText} numberOfLines={3}>
                {latestPost.content}
              </Text>
              {latestPost.images?.[0] ? (
                <Image source={latestPost.images[0]} style={styles.postThumb} contentFit="cover" transition={150} />
              ) : null}
            </View>
            <View style={styles.postStats}>
              <View style={styles.postStat}>
                <Heart
                  size={20}
                  color={latestPost.liked ? colors.error : colors.textSecondary}
                  fill={latestPost.liked ? colors.error : 'transparent'}
                />
                <Text style={styles.postStatText}>{latestPost.likes_count}</Text>
              </View>
              <View style={styles.postStat}>
                <MessageCircle size={20} color={colors.textSecondary} />
                <Text style={styles.postStatText}>{latestPost.comments_count}</Text>
              </View>
            </View>
          </Pressable>
        ) : (
          <Text style={styles.sectionEmpty}>{t('home.noPosts')}</Text>
        )}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t('home.learningResources')}</Text>
          <Pressable onPress={() => router.push('/learn')}>
            <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
          </Pressable>
        </View>
        {latestArticle ? (
          <Pressable
            style={styles.learnCard}
            onPress={() => router.push({ pathname: '/learn/[id]', params: { id: latestArticle.id } })}
          >
            <View style={styles.learnIcon}>
              <BookOpen size={24} color={colors.primary} strokeWidth={2.2} />
            </View>
            <View style={styles.learnText}>
              <Text style={styles.learnTitle} numberOfLines={1}>
                {latestArticle.title}
              </Text>
              <Text style={styles.learnSubtitle} numberOfLines={1}>
                {latestArticle.category}
              </Text>
            </View>
          </Pressable>
        ) : (
          <Text style={styles.sectionEmpty}>{t('home.noArticles')}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  bellWrap: {
    padding: 2,
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E02D2D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  greeting: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  locationText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    minHeight: 52,
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  actionItem: {
    alignItems: 'center',
    width: '23%',
  },
  actionTile: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  foodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  foodCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.sm,
  },
  foodPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  sectionEmpty: {
    color: colors.textMuted,
    fontSize: 15,
    paddingVertical: spacing.md,
  },
  foodImage: {
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  distanceBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  distanceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  foodTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  foodMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  freshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  freshDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  freshText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  postCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EDF5ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  postHeaderText: {
    flex: 1,
  },
  postAuthor: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  postMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  postGroup: {
    color: colors.primary,
    fontWeight: '600',
  },
  postBody: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  postText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textPrimary,
  },
  postThumb: {
    width: 92,
    height: 66,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postStatText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  learnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  learnIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#DBEAD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  learnText: {
    flex: 1,
  },
  learnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  learnSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
})
