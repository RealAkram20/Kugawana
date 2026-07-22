import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Heart, MapPin, MessageCircle, Plus, Search } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { communityService } from '../../services/community.service'
import type { CommunityPost, FeedFilter } from '../../types/community.types'

const FILTERS: FeedFilter[] = ['all', 'request', 'offer', 'discussion']

export default function CommunityScreen() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [filter, setFilter] = useState<FeedFilter>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: posts, isRefetching, refetch } = useQuery({
    queryKey: ['community', filter, debouncedSearch],
    queryFn: () => communityService.feed({ type: filter, q: debouncedSearch }),
  })

  const like = useMutation({
    mutationFn: (postId: number) => communityService.like(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community'] }),
  })

  const openPost = (id: number) => router.push({ pathname: '/community/[id]', params: { id } })

  const renderPost = ({ item }: { item: CommunityPost }) => (
    <Pressable style={styles.post} onPress={() => openPost(item.id)}>
      <View style={styles.postHead}>
        <Pressable
          hitSlop={6}
          onPress={() => router.push({ pathname: '/member/[id]', params: { id: item.author_id } })}
        >
          {item.profile_photo ? (
            <Image source={item.profile_photo} style={styles.avatar} contentFit="cover" transition={150} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{item.author_name?.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
        </Pressable>
        <View style={styles.postMeta}>
          <Text style={styles.author}>{item.author_name}</Text>
          <Text style={styles.time}>{item.time_ago}</Text>
        </View>
        {item.post_type ? (
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>{t(`community.type.${item.post_type}`)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.bodyText}>
          <Text style={styles.content}>{item.content}</Text>
          {item.location ? (
            <View style={styles.locationRow}>
              <MapPin size={16} color={colors.textSecondary} strokeWidth={2} />
              <Text style={styles.location} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          ) : null}
        </View>
        {item.images?.[0] ? (
          <Image source={item.images[0]} style={styles.thumb} contentFit="cover" transition={150} />
        ) : null}
      </View>

      <View style={styles.metrics}>
        <Pressable style={styles.metric} hitSlop={8} onPress={() => like.mutate(item.id)}>
          <Heart
            size={20}
            color={item.liked ? colors.error : colors.textSecondary}
            fill={item.liked ? colors.error : 'transparent'}
            strokeWidth={2}
          />
          <Text style={styles.metricText}>{item.likes_count}</Text>
        </Pressable>
        <Pressable style={styles.metric} hitSlop={8} onPress={() => openPost(item.id)}>
          <MessageCircle size={20} color={colors.textSecondary} strokeWidth={2} />
          <Text style={styles.metricText}>{item.comments_count}</Text>
        </Pressable>
      </View>
    </Pressable>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>{t('community.title')}</Text>

      <View style={styles.searchField}>
        <Search size={22} color={colors.textSecondary} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={t('community.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
        />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((key) => {
          const active = filter === key
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {t(`community.filter.${key}`)}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <FlatList
        data={posts ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={renderPost}
        ListEmptyComponent={<Text style={styles.empty}>{t('community.empty')}</Text>}
        keyboardShouldPersistTaps="handled"
      />

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push('/community/create')}
      >
        <Plus size={32} color={colors.surface} strokeWidth={2.5} />
      </Pressable>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F2F2EF',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F2F2EF',
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chipLabelActive: {
    color: colors.surface,
  },
  list: {
    paddingBottom: 120,
    flexGrow: 1,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  post: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  postHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  avatarText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '700',
  },
  postMeta: {
    flex: 1,
  },
  author: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  time: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: '#E4F1E4',
  },
  badgeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  bodyText: {
    flex: 1,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  location: {
    flex: 1,
    fontSize: 15,
    color: colors.textSecondary,
  },
  thumb: {
    width: 110,
    height: 96,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabPressed: {
    opacity: 0.9,
  },
})
