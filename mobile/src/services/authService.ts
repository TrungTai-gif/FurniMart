import apiClient from '../config/api';
import { LoginCredentials, RegisterData, User, AuthResponse } from '../types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response as AuthResponse;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response as AuthResponse;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.post('/auth/me', {});
    return response as User;
  },
};

