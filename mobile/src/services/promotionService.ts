import apiClient from '../config/api';

export const promotionService = {
  getActive: async () => {
    const response = await apiClient.get('/promotions/active');
    return response;
  },

  getByCode: async (code: string) => {
    const response = await apiClient.get(`/promotions/code/${code}`);
    return response;
  },

  apply: async (data: any) => {
    const response = await apiClient.post('/promotions/apply', data);
    return response;
  },
};

