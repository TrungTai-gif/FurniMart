import apiClient from '../config/api';

export const paymentService = {
  create: async (data: any) => {
    const response = await apiClient.post('/payment', data);
    return response;
  },

  getMyPayments: async () => {
    const response = await apiClient.get('/payment/my-payments');
    return response;
  },

  getByOrderId: async (orderId: string) => {
    const response = await apiClient.get(`/payment/order/${orderId}`);
    return response;
  },
};

