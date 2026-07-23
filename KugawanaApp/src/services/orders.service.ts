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

  async placeOrder(foodId: number, deliveryMethod: 'pickup' | 'delivery', deliveryAddress?: string): Promise<Order> {
    const { data } = await api.post('/orders', {
      food_donation_id: foodId,
      delivery_method: deliveryMethod,
      delivery_address: deliveryAddress,
    })
    return data.data
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

  async topup(packageId: number, paymentMethod: string, reference?: string): Promise<void> {
    await api.post('/wallet/topup', {
      point_package_id: packageId,
      payment_method: paymentMethod,
      payment_reference: reference,
    })
  },
}
