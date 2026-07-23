import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Heart, MapPin, MessageCircle, MoreHorizontal, Send } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { communityService } from '../../services/community.service'
import type { CommunityComment } from '../../types/community.types'

export default function CommunityPostDetailScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data: post } = useQuery({
    queryKey: ['community-post', id],
    queryFn: () => communityService.detail(id),
  })

  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(0)
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [commentCount, setCommentCount] = useState(0)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (!post) return
    setLiked(post.liked)
    setLikes(post.likes_count)
    setComments(post.comments)
    setCommentCount(post.comments_count)
  }, [post])

  const postId = Number(id)

  const toggleLike = () => {
    setLiked((prev) => !prev)
    setLikes((prev) => (liked ? prev - 1 : prev + 1))
    communityService.like(postId).catch(() => {})
  }

  const send = () => {
    const text = draft.trim()
    if (!text) return
    const optimistic: CommunityComment = {
      id: Date.now(),
      author_name: t('postDetail.you'),
      profile_photo: null,
      content: text,
      time_ago: t('postDetail.now'),
    }
    setComments((prev) => [...prev, optimistic])
    setCommentCount((prev) => prev + 1)
    setDraft('')
    communityService.comment(postId, text).catch(() => {})
  }

  if (!post) {
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
        <Text style={styles.headerTitle}>{t('postDetail.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.headerBorder} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.postHead}>
            <Pressable
              style={styles.author}
              onPress={() => router.push({ pathname: '/member/[id]', params: { id: post.author_id } })}
            >
              {post.profile_photo ? (
                <Image source={{ uri: post.profile_photo }} style={styles.avatar} contentFit="cover" transition={200} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>{post.author_name.slice(0, 1)}</Text>
                </View>
              )}
              <View>
                <Text style={styles.authorName}>{post.author_name}</Text>
                <Text style={styles.meta}>
                  {post.time_ago}
                  {!!post.post_type && (
                    <>
                      {' '}
                      {t('postDetail.in')}{' '}
                      <Text style={styles.metaType}>{t(`postDetail.types.${post.post_type}`)}</Text>
                    </>
                  )}
                </Text>
              </View>
            </Pressable>
            <Pressable hitSlop={8} onPress={() => {}}>
              <MoreHorizontal size={24} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
          </View>

          <Text style={styles.body}>{post.content}</Text>

          {post.images.length > 0 && (
            <Image source={{ uri: post.images[0] }} style={styles.postImage} contentFit="cover" transition={200} />
          )}

          {!!post.location && (
            <View style={styles.locationRow}>
              <MapPin size={18} color={colors.textPrimary} strokeWidth={2} />
              <Text style={styles.location}>{post.location}</Text>
            </View>
          )}

          <View style={styles.metrics}>
            <Pressable style={styles.metric} onPress={toggleLike} hitSlop={8}>
              <Heart
                size={22}
                color={liked ? colors.error : colors.textSecondary}
                fill={liked ? colors.error : 'transparent'}
                strokeWidth={2}
              />
              <Text style={styles.metricText}>{likes}</Text>
            </Pressable>
            <View style={styles.metric}>
              <MessageCircle size={22} color={colors.textPrimary} strokeWidth={2} />
              <Text style={styles.metricText}>{commentCount}</Text>
            </View>
          </View>

          <View style={styles.sectionBorder} />

          <Text style={styles.commentsTitle}>
            {t('postDetail.comments')} ({commentCount})
          </Text>

          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentCard}>
              <View style={styles.commentHead}>
                {comment.profile_photo ? (
                  <Image source={{ uri: comment.profile_photo }} style={styles.commentAvatar} contentFit="cover" />
                ) : (
                  <View style={[styles.commentAvatar, styles.commentAvatarFallback]}>
                    <Text style={styles.commentInitial}>{comment.author_name.slice(0, 1)}</Text>
                  </View>
                )}
                <Text style={styles.commentName}>{comment.author_name}</Text>
                <Text style={styles.commentTime}>{comment.time_ago}</Text>
              </View>
              <Text style={styles.commentBody}>{comment.content}</Text>
              <Text style={styles.reply}>{t('postDetail.reply')}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            style={styles.composerInput}
            value={draft}
            onChangeText={setDraft}
            placeholder={t('postDetail.writeComment')}
            placeholderTextColor={colors.textMuted}
          />
          <Pressable
            style={[styles.sendBtn, draft.trim().length > 0 && styles.sendBtnActive]}
            onPress={send}
            disabled={draft.trim().length === 0}
          >
            <Send size={20} color={draft.trim().length > 0 ? '#FFFFFF' : colors.textSecondary} strokeWidth={2} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
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
  headerBorder: {
    height: 1,
    backgroundColor: colors.border,
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  postHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ECEDE7',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  authorName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaType: {
    color: colors.primary,
    fontWeight: '600',
  },
  body: {
    fontSize: 18,
    lineHeight: 26,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  postImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: colors.background,
    marginTop: spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  location: {
    fontSize: 16,
    color: colors.textPrimary,
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
    fontSize: 16,
    color: colors.textPrimary,
  },
  sectionBorder: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  commentCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  commentHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECEDE7',
  },
  commentAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentInitial: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  commentName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  commentTime: {
    fontSize: 13,
    color: colors.textMuted,
  },
  commentBody: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginLeft: 36 + spacing.sm,
  },
  reply: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.sm,
    marginLeft: 36 + spacing.sm,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  composerInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: colors.primary,
  },
})
