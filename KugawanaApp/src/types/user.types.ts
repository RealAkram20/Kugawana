export type UserRole = 'donor' | 'receiver'

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
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
