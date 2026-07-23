import type { AuthResponse, User, UserRole } from '../types/user.types'
import { api } from './api'

interface RegisterPayload {
  name: string
  email: string
  /** E.164, e.g. +254712345678 */
  phone: string
  /** ISO 3166-1 alpha-2 of the dial code the user picked. */
  phone_country: string
  password: string
  role?: UserRole
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post('/auth/register', payload)
    return data.data
  },

  /** `identifier` is an email address or a phone number in any common shape. */
  async login(identifier: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login', { identifier, password })
    return data.data
  },

  async google(idToken: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/google', { id_token: idToken })
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
