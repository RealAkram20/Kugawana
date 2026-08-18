import type {
  CommunityComment,
  CommunityPost,
  CommunityPostDetail,
  CreatePostPayload,
  FeedFilter,
} from '../types/community.types'
import type { PickedImage } from '../types/food.types'
import { api } from './api'

interface FeedParams {
  type?: FeedFilter
  q?: string
}

/** What the server settles on after a like is toggled. */
export interface LikeResult {
  liked: boolean
  likes_count: number
}

/**
 * Photos have to go up as multipart, so the payload is flattened into a
 * FormData. Scalars are stringified because that is all multipart carries.
 */
function toFormData(payload: object): FormData {
  const form = new FormData()

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue

    if (key === 'images' && Array.isArray(value)) {
      for (const image of value as PickedImage[]) {
        // React Native's FormData takes this {uri, name, type} shape directly.
        form.append('images[]', image as unknown as Blob)
      }
      continue
    }

    form.append(key, String(value))
  }

  return form
}

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } }

export const communityService = {
  async feed({ type, q }: FeedParams = {}): Promise<CommunityPost[]> {
    const { data } = await api.get('/community', {
      params: {
        ...(type && type !== 'all' ? { type } : {}),
        ...(q?.trim() ? { q: q.trim() } : {}),
      },
    })
    return data.data
  },

  async detail(id: number | string): Promise<CommunityPostDetail> {
    const { data } = await api.get(`/community/${id}`)
    return data.data
  },

  async post({ images, ...rest }: CreatePostPayload): Promise<CommunityPost> {
    // Without photos a plain JSON body is enough, and cheaper.
    if (!images?.length) {
      const { data } = await api.post('/community', rest)
      return data.data
    }

    const { data } = await api.post('/community', toFormData({ ...rest, images }), multipart)
    return data.data
  },

  async like(postId: number): Promise<LikeResult> {
    const { data } = await api.post(`/community/${postId}/like`)
    return data.data
  },

  async comment(
    postId: number | string,
    content: string,
    parentId?: number | null,
  ): Promise<CommunityComment> {
    const { data } = await api.post(`/community/${postId}/comment`, {
      content,
      ...(parentId ? { parent_id: parentId } : {}),
    })
    return data.data
  },

  /** The replies under one thread starter, loaded when it is expanded. */
  async replies(postId: number | string, commentId: number): Promise<CommunityComment[]> {
    const { data } = await api.get(`/community/${postId}/comments/${commentId}/replies`)
    return data.data
  },
}
