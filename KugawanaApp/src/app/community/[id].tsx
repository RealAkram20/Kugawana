import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Heart, MapPin, MessageCircle, MoreHorizontal, Send, X } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CommentThread } from '../../components/community/CommentThread'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { useLikePost } from '../../hooks/useLikePost'
import { communityService } from '../../services/community.service'
import type { CommunityComment, CommunityPostDetail } from '../../types/community.types'

export default function CommunityPostDetailScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const postId = Number(id)

  const { data: post } = useQuery({
    queryKey: ['community-post', id],
    queryFn: () => communityService.detail(id),
  })

  const like = useLikePost()
  const client = useQueryClient()
  const inputRef = useRef<TextInput>(null)

  // Replies are not part of the post payload, so they are the only thing this
  // screen keeps for itself. Comments and their counts live in the query cache
  // instead of being copied into state, which keeps them correct across a
  // refetch and avoids a seeding effect.
  const [replies, setReplies] = useState<Record<number, CommunityComment[]>>({})
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [loadingReplies, setLoadingReplies] = useState<number | null>(null)
  const [replyTo, setReplyTo] = useState<CommunityComment | null>(null)
  const [draft, setDraft] = useState('')

  const comments = post?.comments ?? []
  const commentCount = post?.comments_count ?? 0

  const patchPost = (update: (detail: CommunityPostDetail) => CommunityPostDetail) =>
    client.setQueryData<CommunityPostDetail>(['community-post', id], (detail) =>
      detail ? update(detail) : detail,
    )

  /** Pulls a thread's replies once, so later toggles are instant. */
  const ensureReplies = async (threadId: number): Promise<CommunityComment[]> => {
    const cached = replies[threadId]
    if (cached) return cached

    setLoadingReplies(threadId)
    try {
      const list = await communityService.replies(postId, threadId)
      setReplies((prev) => ({ ...prev, [threadId]: list }))
      return list
    } catch {
      return []
    } finally {
      setLoadingReplies(null)
    }
  }

  const toggleReplies = async (comment: CommunityComment) => {
    if (expanded[comment.id]) {
      setExpanded((prev) => ({ ...prev, [comment.id]: false }))
      return
    }

    await ensureReplies(comment.id)
    setExpanded((prev) => ({ ...prev, [comment.id]: true }))
  }

  const startReply = (comment: CommunityComment) => {
    setReplyTo(comment)
    // Answering a reply stays in the same thread, so name who it is aimed at.
    if (comment.parent_id) setDraft(`@${comment.author_name} `)
    inputRef.current?.focus()
  }

  const cancelReply = () => {
    setReplyTo(null)
    setDraft('')
  }

  const send = async () => {
    const text = draft.trim()
    if (!text) return

    // The server files a reply-to-a-reply under the same thread starter, so the
    // screen has to agree on which thread the new row belongs to.
    const threadId = replyTo ? (replyTo.parent_id ?? replyTo.id) : null
    const tempId = -Date.now()

    const optimistic: CommunityComment = {
      id: tempId,
      parent_id: threadId,
      author_id: 0,
      author_name: t('postDetail.you'),
      profile_photo: null,
      content: text,
      replies_count: 0,
      time_ago: t('postDetail.now'),
    }

    setDraft('')
    setReplyTo(null)

    if (threadId) {
      // Load what is already there first, or the thread would open showing only
      // the new reply while the counter claims there are more.
      const existing = await ensureReplies(threadId)
      setReplies((prev) => ({ ...prev, [threadId]: [...(prev[threadId] ?? existing), optimistic] }))
      setExpanded((prev) => ({ ...prev, [threadId]: true }))
      patchPost((detail) => ({
        ...detail,
        comments_count: detail.comments_count + 1,
        comments: detail.comments.map((item) =>
          item.id === threadId ? { ...item, replies_count: item.replies_count + 1 } : item,
        ),
      }))
    } else {
      patchPost((detail) => ({
        ...detail,
        comments_count: detail.comments_count + 1,
        comments: [...detail.comments, optimistic],
      }))
    }

    try {
      const saved = await communityService.comment(postId, text, threadId)

      if (threadId) {
        setReplies((prev) => ({
          ...prev,
          [threadId]: (prev[threadId] ?? []).map((item) => (item.id === tempId ? saved : item)),
        }))
      } else {
        patchPost((detail) => ({
          ...detail,
          comments: detail.comments.map((item) => (item.id === tempId ? saved : item)),
        }))
      }
    } catch {
      // Take the placeholder back out rather than leaving a comment on screen
      // that no one else will ever see.
      if (threadId) {
        setReplies((prev) => ({
          ...prev,
          [threadId]: (prev[threadId] ?? []).filter((item) => item.id !== tempId),
        }))
        patchPost((detail) => ({
          ...detail,
          comments_count: Math.max(0, detail.comments_count - 1),
          comments: detail.comments.map((item) =>
            item.id === threadId
              ? { ...item, replies_count: Math.max(0, item.replies_count - 1) }
              : item,
          ),
        }))
      } else {
        patchPost((detail) => ({
          ...detail,
          comments_count: Math.max(0, detail.comments_count - 1),
          comments: detail.comments.filter((item) => item.id !== tempId),
        }))
      }
    }
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

      <KeyboardAvoidingView style={styles.flex} behavior="padding">
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
            <Pressable style={styles.metric} onPress={() => like.mutate(post.id)} hitSlop={8}>
              <Heart
                size={22}
                color={post.liked ? colors.error : colors.textSecondary}
                fill={post.liked ? colors.error : 'transparent'}
                strokeWidth={2}
              />
              <Text style={styles.metricText}>{post.likes_count}</Text>
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
            <CommentThread
              key={comment.id}
              comment={comment}
              replies={replies[comment.id]}
              expanded={!!expanded[comment.id]}
              loading={loadingReplies === comment.id}
              onToggleReplies={toggleReplies}
              onReply={startReply}
            />
          ))}
        </ScrollView>

        <View style={styles.composerWrap}>
          {replyTo ? (
            <View style={styles.replyBanner}>
              <Text style={styles.replyBannerText} numberOfLines={1}>
                {t('postDetail.replyingTo', { name: replyTo.author_name })}
              </Text>
              <Pressable hitSlop={10} onPress={cancelReply}>
                <X size={18} color={colors.textSecondary} strokeWidth={2} />
              </Pressable>
            </View>
          ) : null}

          <View style={styles.composer}>
            <TextInput
              ref={inputRef}
              style={styles.composerInput}
              value={draft}
              onChangeText={setDraft}
              placeholder={
                replyTo
                  ? t('postDetail.replyingTo', { name: replyTo.author_name })
                  : t('postDetail.writeComment')
              }
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
    marginBottom: spacing.lg,
  },
  composerWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  replyBannerText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
