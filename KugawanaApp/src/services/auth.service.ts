import type { AuthResponse, User, UserRole } from '../types/user.types'
import { api } from './api'

interface RegisterPayload {
  name: string
  email: string
  phone: string
  password: string
  role: UserRole
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post('/auth/register', payload)
    return data.data
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login', { email, password })
    return data.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async profile(): Promise<User> {
    const { data } = await api.get('/profile')
    return data.data
  },

  async updateProfile(payload: Partial<User>): Promise<User> {
    const { data } = await api.put('/profile', payload)
    return data.data
  },
}
