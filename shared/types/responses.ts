/**
 * Shared Response Types
 * 
 * API response interfaces shared between backend and frontend.
 */

import { User, Product, Order, Category, Branch, CartItem, ShippingTracking, Wallet, WalletTransaction, Dispute, Review, Promotion, Chat, Payment, InventoryItem } from './entities';

/**
 * Standard API Response
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Auth Response
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

/**
 * JWT Payload
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
  branchId?: string;
}

/**
 * Dashboard Stats
 */
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  pendingOrders?: number;
}

/**
 * Revenue Chart Data
 */
export interface RevenueChartData {
  date: string;
  revenue: number;
}

/**
 * Top Product
 */
export interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  revenue: number;
}

/**
 * Category Stat
 */
export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  totalProducts: number;
  totalSold: number;
}

