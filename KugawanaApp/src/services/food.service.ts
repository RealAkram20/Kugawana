import type { DonationForm, FoodCategory, FoodFilters, FoodListing } from '../types/food.types'
import { api } from './api'

export const foodService = {
  async getListings(filters?: FoodFilters): Promise<FoodListing[]> {
    const { data } = await api.get('/food', { params: filters })
    return data.data
  },

  async getListing(id: number): Promise<FoodListing> {
    const { data } = await api.get(`/food/${id}`)
    return data.data
  },

  async getCategories(): Promise<FoodCategory[]> {
    const { data } = await api.get('/categories')
    return data.data
  },

  async donate(payload: DonationForm): Promise<FoodListing> {
    const { data } = await api.post('/food', payload)
    return data.data
  },

  async myDonations(): Promise<FoodListing[]> {
    const { data } = await api.get('/food/mine')
    return data.data
  },
}
