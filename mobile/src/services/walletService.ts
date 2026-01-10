import apiClient from '../config/api';

export const walletService = {
  getMyWallet: async () => {
    const response = await apiClient.get('/wallet/my-wallet');
    return response;
  },

  deposit: async (data: any) => {
    const response = await apiClient.post('/wallet/deposit', data);
    return response;
  },

  withdraw: async (data: any) => {
    const response = await apiClient.post('/wallet/withdraw', data);
    return response;
  },

  getTransactions: async (filters?: any) => {
    const response = await apiClient.get('/wallet/transactions', { params: filters });
    return response;
  },
};

