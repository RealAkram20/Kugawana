import type { Article } from '../types/community.types'
import { api } from './api'

export const learnService = {
  async articles(): Promise<Article[]> {
    const { data } = await api.get('/learn')
    return data.data
  },

  async article(id: number): Promise<Article> {
    const { data } = await api.get(`/learn/${id}`)
    return data.data
  },
}
