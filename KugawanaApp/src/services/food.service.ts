import type {
  DonationForm,
  FoodCategory,
  FoodFilters,
  FoodListing,
  InterestedRequester,
  PickedImage,
  Unit,
  UpdateDonationPayload,
} from '../types/food.types'
import { api } from './api'

/**
 * Photos have to go up as multipart, so the whole payload is flattened into a
 * FormData. Scalars are stringified because that is all multipart carries.
 */
function toFormData(payload: object): FormData {
  const form = new FormData()

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue

    if (key === 'images' && Array.isArray(value)) {
      for (const image of value as PickedImage[]) {
        // React Native's FormData takes this {uri, name, type} shape directly.
        form.append('images[]', image as unknown as Blob)
      }
      continue
    }

    form.append(key, String(value))
  }

  return form
}

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } }

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

  async getUnits(): Promise<Unit[]> {
    const { data } = await api.get('/units')
    return data.data
  },

  async donate(payload: DonationForm): Promise<FoodListing> {
    const { data } = await api.post('/food', toFormData(payload), multipart)
    return data.data
  },

  async myDonations(): Promise<FoodListing[]> {
    const { data } = await api.get('/food/mine')
    return data.data
  },

  async updateDonation(id: number, payload: UpdateDonationPayload): Promise<FoodListing> {
    // PHP does not parse multipart bodies on PUT, so uploads go out as a POST
    // with _method spoofing. Without photos a plain JSON PUT is enough.
    if (payload.images?.length) {
      const { data } = await api.post(
        `/food/${id}`,
        toFormData({ ...payload, _method: 'PUT' }),
        multipart
      )
      return data.data
    }

    const { images, ...rest } = payload
    const { data } = await api.put(`/food/${id}`, rest)
    return data.data
  },

  async completeDonation(id: number): Promise<FoodListing> {
    const { data } = await api.post(`/food/${id}/complete`)
    return data.data
  },

  async interestedPeople(id: number): Promise<InterestedRequester[]> {
    const { data } = await api.get(`/food/${id}/interested`)
    return data.data
  },
}
