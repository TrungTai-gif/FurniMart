import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthResponse } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      const authData = response as AuthResponse;
      
      // Backend returns accessToken, not token
      const token = authData.accessToken || (authData as any).token;
      
      if (!token) {
        throw new Error('Token không được trả về từ server');
      }
      
      await AsyncStorage.setItem('auth-token', token);
      await AsyncStorage.setItem('user', JSON.stringify(authData.user));
      
      set({
        user: authData.user,
        token: token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    try {
      const response = await authService.register(data);
      const authData = response as AuthResponse;
      
      // Backend returns accessToken, not token
      const token = authData.accessToken || (authData as any).token;
      
      if (!token) {
        throw new Error('Token không được trả về từ server');
      }
      
      await AsyncStorage.setItem('auth-token', token);
      await AsyncStorage.setItem('user', JSON.stringify(authData.user));
      
      set({
        user: authData.user,
        token: token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('auth-token');
    await AsyncStorage.removeItem('user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  loadUser: async () => {
    try {
      const token = await AsyncStorage.getItem('auth-token');
      const userStr = await AsyncStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        
        // Verify token by fetching current user
        try {
          const currentUser = await authService.getMe();
          set({ user: currentUser });
        } catch (error) {
          // Token invalid, logout
          await AsyncStorage.removeItem('auth-token');
          await AsyncStorage.removeItem('user');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      set({ isLoading: false });
    }
  },

  updateUser: (user: User) => {
    set({ user });
    AsyncStorage.setItem('user', JSON.stringify(user));
  },
}));

