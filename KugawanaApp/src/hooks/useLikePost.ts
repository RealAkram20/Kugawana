import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { communityService, type LikeResult } from '../services/community.service'
import type { CommunityPost, CommunityPostDetail } from '../types/community.types'

/**
 * The same post is cached by the home slider, the community feed (once per
 * filter and search term) and the detail screen. Liking it anywhere has to move
 * all of them, otherwise the heart springs back the moment you change tab.
 */
function patchEverywhere(client: QueryClient, postId: number, patch: LikeResult) {
  client.setQueriesData<CommunityPost[]>({ queryKey: ['community'] }, (feed) =>
    feed?.map((post) => (post.id === postId ? { ...post, ...patch } : post)),
  )

  client.setQueriesData<CommunityPostDetail>({ queryKey: ['community-post'] }, (detail) =>
    detail?.id === postId ? { ...detail, ...patch } : detail,
  )
}

/** Whatever any cache currently believes about this post's like state. */
function currentState(client: QueryClient, postId: number): LikeResult | null {
  for (const [, feed] of client.getQueriesData<CommunityPost[]>({ queryKey: ['community'] })) {
    const post = feed?.find((item) => item.id === postId)
    if (post) return { liked: post.liked, likes_count: post.likes_count }
  }

  for (const [, detail] of client.getQueriesData<CommunityPostDetail>({
    queryKey: ['community-post'],
  })) {
    if (detail?.id === postId) return { liked: detail.liked, likes_count: detail.likes_count }
  }

  return null
}

/**
 * Toggles a like from any screen. The heart flips straight away, then settles
 * on whatever the server reports so two devices cannot drift apart.
 */
export function useLikePost() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: (postId: number) => communityService.like(postId),

    onMutate: async (postId) => {
      await client.cancelQueries({ queryKey: ['community'] })
      await client.cancelQueries({ queryKey: ['community-post'] })

      const previous = currentState(client, postId)
      if (!previous) return { previous: null }

      patchEverywhere(client, postId, {
        liked: !previous.liked,
        likes_count: Math.max(0, previous.likes_count + (previous.liked ? -1 : 1)),
      })

      return { previous }
    },

    onError: (_error, postId, context) => {
      if (context?.previous) patchEverywhere(client, postId, context.previous)
    },

    onSuccess: (result, postId) => patchEverywhere(client, postId, result),
  })
}
