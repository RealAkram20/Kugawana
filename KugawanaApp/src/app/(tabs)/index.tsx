import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import {
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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Keyboard,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CartButton } from '../../components/CartButton'
import { CategoryIcon } from '../../components/ui/CategoryIcon'
import { PagedSlider } from '../../components/ui/PagedSlider'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useLikePost } from '../../hooks/useLikePost'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import { communityService } from '../../services/community.service'
import { foodService } from '../../services/food.service'
import { learnService } from '../../services/learn.service'
import { useAuthStore } from '../../stores/auth.store'

/** How many cards each home carousel carries before "See all" takes over. */
const MAX_CARDS = 10

const QUICK_ACTIONS = [
  { key: 'find', icon: Salad, color: '#2D6A2D', route: '/food' as const },
  { key: 'share', icon: CirclePlus, color: '#F5A623', route: '/food/create' as const },
  { key: 'learn', icon: BookOpen, color: '#4285F4', route: '/learn' as const },
  { key: 'community', icon: Users, color: '#7B4FD8', route: '/(tabs)/community' as const },
]

export default function HomeScreen() {
  const { t } = useTranslation()
  const { width } = useWindowDimensions()
  const user = useAuthStore((state) => state.user)
  const [search, setSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  usePushNotifications()
  const { data: listings, isRefetching, refetch } = useQuery({
    queryKey: ['food'],
    queryFn: () => foodService.getListings(),
  })

  // Suggestions load on a pause in typing, keyed apart from the home carousel.
  const debouncedSearch = useDebouncedValue(search.trim(), 250)
  const { data: searchResults } = useQuery({
    queryKey: ['food-search', debouncedSearch],
    queryFn: () => foodService.getListings({ search: debouncedSearch }),
    enabled: debouncedSearch.length > 0,
  })

  const suggestions = (searchResults ?? []).slice(0, 3)
  const suggestionsVisible = showSuggestions && debouncedSearch.length > 0 && suggestions.length > 0

  const openListing = (id: number | string) => {
    setShowSuggestions(false)
    Keyboard.dismiss()
    router.push({ pathname: '/food/[id]', params: { id: String(id) } })
  }

  const { data: posts } = useQuery({
    queryKey: ['community'],
    queryFn: () => communityService.feed(),
  })

  const { data: articles } = useQuery({
    queryKey: ['learn'],
    queryFn: () => learnService.articles(),
  })

  const firstName = user?.name?.split(' ')[0] ?? ''
  const actionLabels: Record<string, string> = {
    find: t('home.findFood'),
    share: t('home.shareFood'),
    learn: t('home.learn'),
    community: t('home.community'),
  }

  // One slide is exactly as wide as the padded content, so paging lands cleanly
  // whatever the device width.
  const slideWidth = width - spacing.md * 2

  const like = useLikePost()

  const availableFood = (listings ?? []).slice(0, MAX_CARDS)
  const recentPosts = (posts ?? []).slice(0, MAX_CARDS)
  const recentArticles = (articles ?? []).slice(0, MAX_CARDS)

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
          <CartButton />
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
            value={search}
            onChangeText={(text) => {
              setSearch(text)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            returnKeyType="search"
            onSubmitEditing={() => setShowSuggestions(false)}
            placeholder={t('home.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
          />
          <Search size={22} color={colors.textPrimary} strokeWidth={2.2} />
        </View>

        {suggestionsVisible ? (
          <View style={styles.suggestions}>
            {suggestions.map((item, index) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.suggestionRow,
                  index > 0 && styles.suggestionDivider,
                  pressed && styles.suggestionPressed,
                ]}
                onPress={() => openListing(item.id)}
              >
                <View style={styles.suggestionThumb}>
                  {item.images?.[0] ? (
                    <Image source={item.images[0]} style={styles.suggestionPhoto} contentFit="cover" />
                  ) : (
                    <CategoryIcon slug={item.category_icon} size={22} />
                  )}
                </View>
                <View style={styles.suggestionText}>
                  <Text style={styles.suggestionTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.suggestionMeta} numberOfLines={1}>{item.quantity}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

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
          <Text style={styles.sectionTitle}>{t('home.availableFood')}</Text>
          <Pressable onPress={() => router.push('/food')}>
            <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
          </Pressable>
        </View>
        {availableFood.length > 0 ? (
          <View style={styles.slider}>
            <PagedSlider
              data={availableFood}
              slideWidth={slideWidth}
              perSlide={2}
              keyExtractor={(item) => String(item.id)}
              renderItem={(item) => (
                <Pressable
                  style={styles.foodCard}
                  onPress={() => router.push({ pathname: '/food/[id]', params: { id: item.id } })}
                >
                  <View style={styles.foodImage}>
                    {item.images?.[0] ? (
                      <Image source={item.images[0]} style={styles.foodPhoto} contentFit="cover" transition={150} />
                    ) : (
                      <CategoryIcon slug={item.category_icon} size={40} />
                    )}
                  </View>
                  <Text style={styles.foodTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.foodMeta} numberOfLines={1}>
                    {item.pickup_address ?? ''}
                  </Text>
                  <Text style={styles.foodMeta} numberOfLines={1}>
                    {item.is_split
                      ? t('food.unitsLeft', {
                          available: item.units_available,
                          total: item.units_total,
                        })
                      : item.quantity}
                  </Text>
                  <View style={styles.freshRow}>
                    <View style={styles.freshDot} />
                    <Text style={styles.freshText}>{t('home.fresh')}</Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        ) : (
          <Text style={styles.sectionEmpty}>{t('home.noAvailableFood')}</Text>
        )}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t('home.recentPosts')}</Text>
          <Pressable onPress={() => router.push('/(tabs)/community')}>
            <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
          </Pressable>
        </View>
        {recentPosts.length > 0 ? (
          <View style={styles.slider}>
            <PagedSlider
              data={recentPosts}
              slideWidth={slideWidth}
              keyExtractor={(post) => String(post.id)}
              renderItem={(post) => (
                // The card is a plain View so the like button is a sibling of the
                // link, not a child of it. Nested Pressables let the outer one
                // take the touch, which is what stopped the heart working here.
                <View style={styles.postCard}>
                  <Pressable
                    style={styles.postLink}
                    onPress={() => router.push({ pathname: '/community/[id]', params: { id: post.id } })}
                  >
                    <View style={styles.postHeader}>
                      {post.profile_photo ? (
                        <Image source={post.profile_photo} style={styles.avatar} contentFit="cover" />
                      ) : (
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>{post.author_name?.slice(0, 1).toUpperCase()}</Text>
                        </View>
                      )}
                      <View style={styles.postHeaderText}>
                        <Text style={styles.postAuthor} numberOfLines={1}>
                          {post.author_name}
                        </Text>
                        <Text style={styles.postMeta}>{post.time_ago}</Text>
                      </View>
                      <Ellipsis size={20} color={colors.textSecondary} />
                    </View>
                    <View style={styles.postBody}>
                      <Text style={styles.postText} numberOfLines={3}>
                        {post.content}
                      </Text>
                      {post.images?.[0] ? (
                        <Image source={post.images[0]} style={styles.postThumb} contentFit="cover" transition={150} />
                      ) : null}
                    </View>
                  </Pressable>

                  <View style={styles.postStats}>
                    <Pressable
                      style={styles.postStat}
                      hitSlop={10}
                      onPress={() => like.mutate(post.id)}
                    >
                      <Heart
                        size={20}
                        color={post.liked ? colors.error : colors.textSecondary}
                        fill={post.liked ? colors.error : 'transparent'}
                      />
                      <Text style={styles.postStatText}>{post.likes_count}</Text>
                    </Pressable>
                    <Pressable
                      style={styles.postStat}
                      hitSlop={10}
                      onPress={() => router.push({ pathname: '/community/[id]', params: { id: post.id } })}
                    >
                      <MessageCircle size={20} color={colors.textSecondary} />
                      <Text style={styles.postStatText}>{post.comments_count}</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            />
          </View>
        ) : (
          <Text style={styles.sectionEmpty}>{t('home.noPosts')}</Text>
        )}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t('home.learningResources')}</Text>
          <Pressable onPress={() => router.push('/learn')}>
            <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
          </Pressable>
        </View>
        {recentArticles.length > 0 ? (
          <PagedSlider
            data={recentArticles}
            slideWidth={slideWidth}
            keyExtractor={(article) => String(article.id)}
            renderItem={(article) => (
              <Pressable
                style={styles.learnCard}
                onPress={() => router.push({ pathname: '/learn/[id]', params: { id: article.id } })}
              >
                <View style={styles.learnIcon}>
                  <BookOpen size={24} color={colors.primary} strokeWidth={2.2} />
                </View>
                <View style={styles.learnText}>
                  <Text style={styles.learnTitle} numberOfLines={2}>
                    {article.title}
                  </Text>
                  <Text style={styles.learnSubtitle} numberOfLines={1}>
                    {article.category}
                  </Text>
                </View>
              </Pressable>
            )}
          />
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
  suggestions: {
    marginTop: -spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  suggestionDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  suggestionPressed: {
    backgroundColor: colors.background,
  },
  suggestionThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  suggestionPhoto: {
    width: '100%',
    height: '100%',
  },
  suggestionText: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  suggestionMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
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
  slider: {
    marginBottom: spacing.lg,
  },
  foodCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
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
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  foodMeta: {
    fontSize: 14,
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
    // Fills the slide so every page is the same height and the dots stay put.
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
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
  // Fills the card above the stats row, so tapping anywhere on the card still
  // opens the post the way it did when the whole card was one button.
  postLink: {
    flex: 1,
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
