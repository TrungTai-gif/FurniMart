import apiClient from '../config/api';
import { Product, Category } from '../types';

export const productService = {
  getAll: async (filters?: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<Product[]> => {
    const response = await apiClient.get('/products', { params: filters });
    return Array.isArray(response) ? response : [];
  },

  getById: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    return response as Product;
  },
};

export const categoryService = {
  getAll: async (): Promise<Category[]> => {
    const response = await apiClient.get('/categories');
    return Array.isArray(response) ? response : [];
  },
};

