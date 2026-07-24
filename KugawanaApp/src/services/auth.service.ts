import type { PickedImage } from '../types/food.types'
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

  /** Ask the server to email a fresh verification link. */
  async resendVerification(email: string): Promise<void> {
    await api.post('/auth/email/resend', { email })
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async profile(): Promise<User> {
    const { data } = await api.get('/profile')
    return data.data
  },

  /**
   * Sends JSON normally. When a new avatar is attached the whole payload has to
   * go up as multipart instead — and since PHP does not parse multipart bodies on
   * PUT, it goes out as a POST carrying `_method=PUT`, the same trick the food
   * service uses for listing photos.
   */
  async updateProfile(payload: Partial<User>, photo?: PickedImage | null): Promise<User> {
    if (!photo) {
      const { data } = await api.put('/profile', payload)
      return data.data
    }

    const form = new FormData()

    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined || value === null) continue
      form.append(key, String(value))
    }

    // React Native's FormData takes this {uri, name, type} shape directly.
    form.append('profile_photo', photo as unknown as Blob)
    form.append('_method', 'PUT')

    const { data } = await api.post('/profile', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  },
}
