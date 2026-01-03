import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';

/**
 * Helper function to get API Gateway URL based on platform
 * 
 * Microservice Architecture:
 * - All API calls go through the API Gateway (port 3001)
 * - API Gateway routes requests to appropriate microservices
 * - In production, use your production API Gateway URL
 * 
 * Development:
 * - Android Emulator: http://10.0.2.2:3001/api
 * - iOS Simulator: http://localhost:3001/api
 * - Physical Device: http://YOUR_COMPUTER_IP:3001/api
 */
const getApiUrl = (): string => {
  // Production API Gateway URL
  if (!__DEV__) {
    return process.env.API_GATEWAY_URL || 'https://your-production-api.com/api';
  }

  // Development: Get computer IP from environment or use default
  // You can set this via: export API_GATEWAY_IP=192.168.1.14
  const YOUR_COMPUTER_IP = process.env.API_GATEWAY_IP || '192.168.1.14';
  
  // Android emulator uses special IP to access host machine
  if (Platform.OS === 'android') {
    // Check if running on emulator
    const isEmulator = Platform.constants?.isDevice === false;
    if (isEmulator) {
      // Android emulator uses 10.0.2.2 to access host machine
      return 'http://10.0.2.2:3001/api';
    }
    // Physical Android device - use computer's IP
    return `http://${YOUR_COMPUTER_IP}:3001/api`;
  }

  // iOS simulator can use localhost
  const isIOSSimulator = Platform.OS === 'ios' && Platform.isPad === false && Platform.isTVOS === false;
  if (isIOSSimulator) {
    return 'http://localhost:3001/api';
  }
  
  // Physical iOS device - use computer's IP
  return `http://${YOUR_COMPUTER_IP}:3001/api`;
};

const API_URL = getApiUrl();

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Increased timeout for mobile networks
});

// Helper function to get token from AsyncStorage
const getToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('auth-token');
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Request Interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Backend ResponseInterceptor wraps response in { success, statusCode, message, data }
    // Extract data if wrapped, otherwise return response.data directly
    if (response.data && typeof response.data === 'object' && 'data' in response.data && 'success' in response.data) {
      return response.data.data as any;
    }
    return response.data as any;
  },
  async (error: AxiosError<any>) => {
    let message = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
    const status = error.response?.status;

    // Handle network errors specifically
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        message = 'Lỗi kết nối. Vui lòng kiểm tra kết nối mạng.';
      } else if (error.message.includes('Network Error') || error.message.includes('ERR_NETWORK')) {
        message = 'Lỗi kết nối. Vui lòng kiểm tra kết nối mạng.';
      }
    }

    if (status === 401) {
      // Clear token and redirect to login
      await AsyncStorage.removeItem('auth-token');
      // Navigation will be handled by AuthContext
    }

    return Promise.reject({
      message,
      status,
      data: error.response?.data,
    });
  },
);

export default apiClient;
export { API_URL };

// Helper function to get base URL (without /api)
export const getBaseUrl = (): string => {
  const apiUrl = API_URL;
  // Remove /api from the end if present
  return apiUrl.replace(/\/api$/, '');
};

// Helper function to convert relative image URL to absolute URL
export const getImageUrl = (imagePath: string | undefined | null): string => {
  if (!imagePath) {
    return 'https://via.placeholder.com/150';
  }
  
  // If already absolute URL (starts with http:// or https://), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If relative URL (starts with /), prepend base URL
  if (imagePath.startsWith('/')) {
    const baseUrl = getBaseUrl();
    return `${baseUrl}${imagePath}`;
  }
  
  // Otherwise, assume it's a relative path and prepend base URL + /uploads
  const baseUrl = getBaseUrl();
  return `${baseUrl}/uploads/${imagePath}`;
};

