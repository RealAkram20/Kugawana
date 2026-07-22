import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircle } from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Card } from '../../components/ui/Card'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { communityService } from '../../services/community.service'

export default function CommunityScreen() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')

  const { data: posts, isRefetching, refetch } = useQuery({
    queryKey: ['community'],
    queryFn: () => communityService.feed(),
  })

  const createPost = useMutation({
    mutationFn: () => communityService.post(content),
    onSuccess: () => {
      setContent('')
      queryClient.invalidateQueries({ queryKey: ['community'] })
    },
  })

  const like = useMutation({
    mutationFn: (postId: number) => communityService.like(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community'] }),
  })

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={posts ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>{t('community.title')}</Text>
            <Card style={styles.composer}>
              <TextInput
                style={styles.input}
                value={content}
                onChangeText={setContent}
                placeholder={t('community.placeholder')}
                placeholderTextColor={colors.textMuted}
                multiline
              />
              <Pressable
                style={[styles.postBtn, content.trim().length === 0 && styles.postBtnDisabled]}
                disabled={content.trim().length === 0 || createPost.isPending}
                onPress={() => createPost.mutate()}
              >
                <Text style={styles.postBtnLabel}>{t('community.post')}</Text>
              </Pressable>
            </Card>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.post}>
            <View style={styles.postHead}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.author_name.slice(0, 1)}</Text>
              </View>
              <View style={styles.postMeta}>
                <Text style={styles.author}>{item.author_name}</Text>
                <Text style={styles.time}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
            </View>
            <Text style={styles.content}>{item.content}</Text>
            <Pressable style={styles.likeRow} onPress={() => like.mutate(item.id)}>
              <View style={styles.metric}>
                <Heart
                  size={17}
                  color={item.liked ? colors.error : colors.textSecondary}
                  fill={item.liked ? colors.error : 'transparent'}
                />
                <Text style={styles.likeText}>{item.likes_count}</Text>
              </View>
              <View style={styles.metric}>
                <MessageCircle size={17} color={colors.textSecondary} />
                <Text style={styles.commentCount}>{item.comments_count}</Text>
              </View>
            </Pressable>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{t('community.empty')}</Text>}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  composer: {
    marginBottom: spacing.lg,
  },
  input: {
    minHeight: 60,
    fontSize: 15,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  postBtn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  postBtnDisabled: {
    opacity: 0.5,
  },
  postBtnLabel: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 14,
  },
  post: {
    marginBottom: spacing.md,
  },
  postHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.surface,
    fontWeight: '700',
  },
  postMeta: {
    flex: 1,
  },
  author: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  time: {
    fontSize: 11,
    color: colors.textMuted,
  },
  content: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  likeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  likeText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  commentCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
})
