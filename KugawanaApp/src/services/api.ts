import axios from 'axios'
import { useAuthStore } from '../stores/auth.store'

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 'local-session' is the offline demo session created by the OTP screen;
    // it can never authenticate, so a 401 must not log the user out
    const token = useAuthStore.getState().token
    if (error.response?.status === 401 && token !== 'local-session') {
      useAuthStore.getState().clear()
    }
    return Promise.reject(error)
  }
)
