import type { Order, PointPackage, WalletTransaction } from '../types/order.types'
import { api } from './api'

export const ordersService = {
  async myOrders(): Promise<Order[]> {
    const { data } = await api.get('/orders')
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
