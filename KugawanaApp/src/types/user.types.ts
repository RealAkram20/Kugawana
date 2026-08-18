export type UserRole = 'donor' | 'receiver'

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  /** ISO 3166-1 alpha-2 of the dial code behind `phone`; write-only for the API. */
  phone_country?: string | null
  role: UserRole
  country_id: number | null
  country_name?: string | null
  district: string | null
  address: string | null
  latitude?: number | null
  longitude?: number | null
  bio: string | null
  profile_photo: string | null
  wallet_balance: number
  responsibility_score: number
}

export interface AuthResponse {
  token: string
  user: User
}
