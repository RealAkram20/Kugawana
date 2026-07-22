import { useQuery } from '@tanstack/react-query'
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
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { foodService } from '../../services/food.service'
import { useAuthStore } from '../../stores/auth.store'

const SAMPLE_FOOD = [
  { id: 'bananas', title: 'Bananas', emoji: '🍌', tint: '#FDF3D8', distance: '200m', when: 'Today, 4:00 PM' },
  { id: 'rice', title: 'Cooked Rice', emoji: '🍚', tint: '#F3EFE7', distance: '350m', when: 'Today, 3:30 PM' },
  { id: 'vegetables', title: 'Vegetables', emoji: '🥦', tint: '#E8F3E4', distance: '500m', when: 'Tomorrow' },
]

const SAMPLE_POST = {
  author: 'Grace A.',
  when: '1h ago',
  group: 'Food Sharing',
  text: 'I have extra tomatoes and onions. Anyone nearby interested?',
  emoji: '🍅',
  tint: '#F9E3DC',
  likes: 12,
  comments: 5,
}

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

  const firstName = user?.name?.split(' ')[0] ?? ''
  const actionLabels: Record<string, string> = {
    find: t('home.findFood'),
    share: t('home.shareFood'),
    learn: t('home.learn'),
    community: t('home.community'),
  }

  const nearby =
    listings && listings.length > 0
      ? listings.slice(0, 3).map((item) => ({
          id: String(item.id),
          title: item.title,
          emoji: '🥗',
          tint: '#E8F3E4',
          distance: item.pickup_address ?? '',
          when: item.expiry_date,
        }))
      : SAMPLE_FOOD

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
          {t('home.greeting')}, {firstName} 👋
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
        <View style={styles.foodRow}>
          {nearby.map((item) => (
            <Pressable key={item.id} style={styles.foodCard} onPress={() => router.push('/food')}>
              <View style={[styles.foodImage, { backgroundColor: item.tint }]}>
                <Text style={styles.foodEmoji}>{item.emoji}</Text>
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceBadgeText}>{item.distance}</Text>
                </View>
              </View>
              <Text style={styles.foodTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.foodMeta}>{`${item.distance} ${t('home.away')}`}</Text>
              <Text style={styles.foodMeta} numberOfLines={1}>
                {item.when}
              </Text>
              <View style={styles.freshRow}>
                <View style={styles.freshDot} />
                <Text style={styles.freshText}>{t('home.fresh')}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t('home.recentPosts')}</Text>
          <Pressable onPress={() => router.push('/(tabs)/community')}>
            <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
          </Pressable>
        </View>
        <Pressable style={styles.postCard} onPress={() => router.push('/(tabs)/community')}>
          <View style={styles.postHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{SAMPLE_POST.author[0]}</Text>
            </View>
            <View style={styles.postHeaderText}>
              <Text style={styles.postAuthor}>{SAMPLE_POST.author}</Text>
              <Text style={styles.postMeta}>
                {SAMPLE_POST.when} {t('home.in')} <Text style={styles.postGroup}>{SAMPLE_POST.group}</Text>
              </Text>
            </View>
            <Ellipsis size={20} color={colors.textSecondary} />
          </View>
          <View style={styles.postBody}>
            <Text style={styles.postText}>{SAMPLE_POST.text}</Text>
            <View style={[styles.postThumb, { backgroundColor: SAMPLE_POST.tint }]}>
              <Text style={styles.postThumbEmoji}>{SAMPLE_POST.emoji}</Text>
            </View>
          </View>
          <View style={styles.postStats}>
            <View style={styles.postStat}>
              <Heart size={20} color="#E0245E" fill="#E0245E" />
              <Text style={styles.postStatText}>{SAMPLE_POST.likes}</Text>
            </View>
            <View style={styles.postStat}>
              <MessageCircle size={20} color={colors.textSecondary} />
              <Text style={styles.postStatText}>{SAMPLE_POST.comments}</Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t('home.learningResources')}</Text>
          <Pressable onPress={() => router.push('/learn')}>
            <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
          </Pressable>
        </View>
        <Pressable style={styles.learnCard} onPress={() => router.push('/learn')}>
          <View style={styles.learnIcon}>
            <BookOpen size={24} color={colors.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.learnText}>
            <Text style={styles.learnTitle}>{t('home.learnSampleTitle')}</Text>
            <Text style={styles.learnSubtitle}>{t('home.learnSampleSubtitle')}</Text>
          </View>
        </Pressable>
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
  foodImage: {
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  foodEmoji: {
    fontSize: 44,
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
  postThumbEmoji: {
    fontSize: 32,
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
