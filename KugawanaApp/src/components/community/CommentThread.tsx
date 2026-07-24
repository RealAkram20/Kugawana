import { Image } from 'expo-image'
import { ChevronDown, ChevronUp } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import type { CommunityComment } from '../../types/community.types'

interface CommentThreadProps {
  comment: CommunityComment
  replies: CommunityComment[] | undefined
  expanded: boolean
  loading: boolean
  onToggleReplies: (comment: CommunityComment) => void
  onReply: (comment: CommunityComment) => void
}

function Avatar({ comment, size }: { comment: CommunityComment; size: number }) {
  const style = { width: size, height: size, borderRadius: size / 2 }

  if (comment.profile_photo) {
    return (
      <Image
        source={{ uri: comment.profile_photo }}
        style={[styles.avatar, style]}
        contentFit="cover"
      />
    )
  }

  return (
    <View style={[styles.avatar, styles.avatarFallback, style]}>
      <Text style={styles.avatarInitial}>{comment.author_name?.slice(0, 1).toUpperCase()}</Text>
    </View>
  )
}

function CommentRow({
  comment,
  size,
  onReply,
}: {
  comment: CommunityComment
  size: number
  onReply: (comment: CommunityComment) => void
}) {
  const { t } = useTranslation()

  return (
    <View style={styles.row}>
      <Avatar comment={comment} size={size} />
      <View style={styles.rowBody}>
        <View style={styles.rowHead}>
          <Text style={styles.name}>{comment.author_name}</Text>
          <Text style={styles.time}>{comment.time_ago}</Text>
        </View>
        <Text style={styles.body}>{comment.content}</Text>
        <Pressable hitSlop={8} onPress={() => onReply(comment)}>
          <Text style={styles.reply}>{t('postDetail.reply')}</Text>
        </Pressable>
      </View>
    </View>
  )
}

/**
 * One thread: a comment and, behind a "View N replies" row, the answers to it.
 * Threads are only ever two deep, so replies render as a flat indented list
 * rather than recursing.
 */
export function CommentThread({
  comment,
  replies,
  expanded,
  loading,
  onToggleReplies,
  onReply,
}: CommentThreadProps) {
  const { t } = useTranslation()

  // The optimistic count can run ahead of what has been fetched, so trust
  // whichever is larger while a reply is still in flight.
  const count = Math.max(comment.replies_count, replies?.length ?? 0)

  return (
    <View style={styles.thread}>
      <CommentRow comment={comment} size={40} onReply={onReply} />

      {count > 0 ? (
        <View style={styles.replyBlock}>
          <Pressable style={styles.toggle} hitSlop={6} onPress={() => onToggleReplies(comment)}>
            <View style={styles.toggleRule} />
            <Text style={styles.toggleLabel}>
              {expanded ? t('postDetail.hideReplies') : t('postDetail.viewReplies', { count })}
            </Text>
            {loading ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : expanded ? (
              <ChevronUp size={18} color={colors.textSecondary} strokeWidth={2} />
            ) : (
              <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2} />
            )}
          </Pressable>

          {expanded
            ? (replies ?? []).map((reply) => (
                <View key={reply.id} style={styles.replyRow}>
                  <CommentRow comment={reply} size={32} onReply={onReply} />
                </View>
              ))
            : null}
        </View>
      ) : null}
    </View>
  )
}

const INDENT = 40 + spacing.sm

const styles = StyleSheet.create({
  thread: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    backgroundColor: '#ECEDE7',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  time: {
    fontSize: 13,
    color: colors.textMuted,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  reply: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  replyBlock: {
    marginLeft: INDENT,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  toggleRule: {
    width: 24,
    height: 1,
    backgroundColor: colors.border,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  replyRow: {
    marginTop: spacing.md,
  },
})
