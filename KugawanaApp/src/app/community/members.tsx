import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { ArrowLeft, ChevronRight, Search, Star } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { memberService } from '../../services/member.service'

export default function CommunityMembersScreen() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: () => memberService.list(),
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return members ?? []
    return (members ?? []).filter((m) => m.name.toLowerCase().includes(q))
  }, [members, search])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          hitSlop={12}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/community'))}
        >
          <ArrowLeft size={26} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('members.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchBar}>
        <Search size={20} color={colors.textSecondary} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={t('members.searchPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable
              style={styles.rowMain}
              onPress={() => router.push({ pathname: '/member/[id]', params: { id: item.id } })}
            >
              {item.profile_photo ? (
                <Image source={{ uri: item.profile_photo }} style={styles.avatar} contentFit="cover" transition={200} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>{item.name.slice(0, 1)}</Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                {item.reviews_count > 0 ? (
                  <View style={styles.ratingRow}>
                    <Star size={18} color={colors.accent} fill={colors.accent} strokeWidth={0} />
                    <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
                    <Text style={styles.reviews}>({item.reviews_count})</Text>
                  </View>
                ) : (
                  <Text style={styles.noRating}>{t('orders.noRatings')}</Text>
                )}
                <Text style={styles.role}>{item.role_label}</Text>
              </View>
              <ChevronRight size={22} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const avatarSize = 64

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
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 26,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    padding: 0,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rating: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reviews: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  role: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  noRating: {
    fontSize: 15,
    color: colors.textMuted,
  },
})
