import type { CommunityPost } from '../types/community.types'
import { api } from './api'

export const communityService = {
  async feed(): Promise<CommunityPost[]> {
    const { data } = await api.get('/community')
    return data.data
  },

  async post(content: string): Promise<CommunityPost> {
    const { data } = await api.post('/community', { content })
    return data.data
  },

  async like(postId: number): Promise<void> {
    await api.post(`/community/${postId}/like`)
  },
}
