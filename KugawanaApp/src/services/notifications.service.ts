import { api } from './api'

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string
  /** Screen family the row opens, e.g. 'community' or 'food/shared'. */
  route: string | null
  route_id: number | string | null
  read: boolean
  time_ago: string
  created_at: string
}

export interface NotificationFeed {
  notifications: AppNotification[]
  unread_count: number
}

export const notificationsService = {
  async list(): Promise<NotificationFeed> {
    const { data } = await api.get('/notifications')
    return data.data
  },

  async markRead(id: string): Promise<number> {
    const { data } = await api.post(`/notifications/${id}/read`)
    return data.data.unread_count
  },

  async markAllRead(): Promise<void> {
    await api.post('/notifications/read-all')
  },

  async registerPushToken(token: string, platform: string): Promise<void> {
    await api.post('/push-token', { token, platform })
  },

  async removePushToken(token: string): Promise<void> {
    await api.delete('/push-token', { data: { token } })
  },
}
