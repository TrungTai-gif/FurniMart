import apiClient from '../config/api';
import { Order, Address } from '../types';

export const orderService = {
  create: async (data: {
    items: Array<{ product: string; quantity: number; price: number }>;
    shippingAddress: Address;
    paymentMethod: string;
  }): Promise<Order> => {
    const response = await apiClient.post('/orders', data);
    return response as Order;
  },

  getMyOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get('/orders/my-orders');
    return Array.isArray(response) ? response : [];
  },

  getById: async (id: string): Promise<Order> => {
    const response = await apiClient.get(`/orders/${id}`);
    return response as Order;
  },
};

