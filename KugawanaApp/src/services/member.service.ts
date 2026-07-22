import type { MemberListItem, MemberProfile } from '../types/member.types'
import { api } from './api'

export const memberService = {
  async list(search?: string): Promise<MemberListItem[]> {
    const { data } = await api.get('/members', { params: search ? { search } : undefined })
    return data.data
  },

  async get(id: number | string): Promise<MemberProfile> {
    const { data } = await api.get(`/members/${id}`)
    return data.data
  },
}
