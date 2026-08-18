import type { CheckoutPayload, CheckoutResult } from '../types/cart.types'
import type {
  Order,
  PointPackage,
  UpdateOrderPayload,
  WalletTransaction,
} from '../types/order.types'
import { api } from './api'

export const ordersService = {
  async myOrders(): Promise<Order[]> {
    const { data } = await api.get('/orders')
    return data.data
  },

  async getOrder(id: number): Promise<Order> {
    const { data } = await api.get(`/orders/${id}`)
    return data.data
  },

  async updateOrder(id: number, payload: UpdateOrderPayload): Promise<Order> {
    const { data } = await api.put(`/orders/${id}`, payload)
    return data.data
  },

  async cancelOrder(id: number): Promise<Order> {
    const { data } = await api.post(`/orders/${id}/cancel`)
    return data.data
  },

  async rateOrder(id: number, stars: number, comment?: string): Promise<void> {
    await api.post(`/orders/${id}/rate`, { stars, comment })
  },

  async completeOrder(id: number): Promise<Order> {
    const { data } = await api.post(`/orders/${id}/complete`)
    return data.data
  },

  async placeOrder(
    foodId: number,
    deliveryMethod: 'pickup' | 'delivery',
    deliveryAddress?: string,
    units = 1,
  ): Promise<Order> {
    const { data } = await api.post('/orders', {
      food_donation_id: foodId,
      delivery_method: deliveryMethod,
      delivery_address: deliveryAddress,
      units,
    })
    return data.data
  },

  /** Places a whole basket in one request; some lines may be skipped or reduced. */
  async checkout(payload: CheckoutPayload): Promise<CheckoutResult> {
    try {
      const { data } = await api.post('/orders/checkout', payload)
      return data.data
    } catch (error: any) {
      // A basket where nothing could be placed comes back 422 but still carries
      // the per-line reasons, so surface it as a result, not a thrown error.
      if (error.response?.status === 422 && error.response.data?.data) {
        return error.response.data.data as CheckoutResult
      }
      throw error
    }
  },
}

export const walletService = {
  async wallet(): Promise<{ balance: number; transactions: WalletTransaction[] }> {
    const { data } = await api.get('/wallet')
    return data.data
  },

  async packages(): Promise<PointPackage[]> {
    const { data } = await api.get('/wallet/packages')
    return data.data
  },

  async topup(
    packageId: number,
    paymentMethod: string,
    reference?: string,
  ): Promise<TopupResponse> {
    const { data } = await api.post('/wallet/topup', {
      point_package_id: packageId,
      payment_method: paymentMethod,
      payment_reference: reference,
    })
    return data.data
  },

  async topupStatus(topupId: number): Promise<TopupStatusResponse> {
    const { data } = await api.get(`/wallet/topup/${topupId}/status`)
    return data.data
  },
}

export interface TopupResponse {
  id: number
  status: string
  redirect_url?: string
  order_tracking_id?: string
}

export interface TopupStatusResponse {
  id: number
  status: string
  balance: number
}
