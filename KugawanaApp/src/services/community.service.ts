import type {
  CommunityPost,
  CommunityPostDetail,
  CreatePostPayload,
  FeedFilter,
} from '../types/community.types'
import { api } from './api'

interface FeedParams {
  type?: FeedFilter
  q?: string
}

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

  async post(payload: CreatePostPayload): Promise<CommunityPost> {
    const { data } = await api.post('/community', payload)
    return data.data
  },

  async like(postId: number): Promise<void> {
    await api.post(`/community/${postId}/like`)
  },

  async comment(postId: number | string, content: string): Promise<void> {
    await api.post(`/community/${postId}/comment`, { content })
  },
}
