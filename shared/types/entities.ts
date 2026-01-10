/**
 * Shared Entity Types
 * 
 * Core entity interfaces shared between backend and frontend.
 * These types are derived from backend schemas and DTOs.
 */

import { UserRole, OrderStatus, PaymentMethod, DisputeType, DisputeStatus, WalletTransactionType, WalletTransactionStatus, ShippingStatus, PromotionType } from './index';

/**
 * User Entity
 */
export interface User {
  id: string;
  _id?: string; // MongoDB _id
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  branchId?: string;
  address?: string;
  addresses?: Array<{
    name: string;
    phone: string;
    street: string;
    ward: string;
    district: string;
    city: string;
    isDefault?: boolean;
  }>;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Product Entity
 */
export interface Product {
  id: string;
  _id?: string;
  name: string;
  description: string;
  price: number;
  discount?: number;
  stock?: number;
  images: string[];
  model3d?: string;
  categoryId: string;
  category?: string | Category;
  materials?: string[];
  colors?: string[];
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
    unit?: string;
  };
  rating?: number;
  reviewCount?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Category Entity
 */
export interface Category {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Order Item
 */
export interface OrderItem {
  id?: string;
  productId: string;
  productName?: string;
  product?: Product;
  quantity: number;
  price: number;
  discount?: number;
}

/**
 * Order Entity
 */
export interface Order {
  id: string;
  _id?: string;
  customerId: string;
  user?: User;
  items: OrderItem[];
  totalPrice: number;
  totalDiscount?: number;
  shippingAddress: string;
  phone: string;
  paymentMethod: PaymentMethod | string;
  paymentStatus?: "UNPAID" | "PAID" | "REFUND_PENDING" | "REFUNDED" | "FAILED" | "pending" | "paid" | "failed" | "refunded";
  isPaid?: boolean;
  status: OrderStatus | string;
  branchId?: string;
  branch?: Branch;
  shipperId?: string;
  shipper?: User;
  assignedEmployeeId?: string; // Employee được phân công xử lý đơn
  assignedEmployee?: User; // Populated employee
  trackingNumber?: string;
  notes?: string;
  promotionId?: string;
  promotionCode?: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Branch Entity
 */
export interface Branch {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  address: string | {
    street: string;
    ward: string;
    district: string;
    city: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  phone: string;
  email?: string;
  status?: "pending" | "approved" | "rejected" | "active" | "inactive";
  isActive?: boolean;
  managerId?: string;
  registrationData?: {
    businessLicense?: string;
    taxCode?: string;
    ownerName?: string;
    ownerPhone?: string;
    ownerEmail?: string;
    documents?: string[];
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Cart Item
 */
export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  branchId?: string;
  branch?: Branch;
  price: number;
}

/**
 * Shipping Tracking
 */
export interface ShippingTracking {
  id: string;
  _id?: string;
  orderId: string;
  order?: Order;
  shipperId: string;
  shipper?: User;
  status: ShippingStatus | string;
  currentLocation?: string;
  estimatedDelivery?: string;
  proofOfDeliveryImages?: string[];
  customerSignature?: string;
  deliveryNote?: string;
  deliveryFailedReason?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Wallet Entity
 */
export interface Wallet {
  id: string;
  _id?: string;
  userId: string;
  balance: number;
  lockedBalance?: number;
  totalDeposited?: number;
  totalWithdrawn?: number;
  currency?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Wallet Transaction
 */
export interface WalletTransaction {
  id: string;
  _id?: string;
  walletId: string;
  userId: string;
  type: WalletTransactionType | string;
  amount: number;
  status: WalletTransactionStatus | string;
  orderId?: string;
  paymentId?: string;
  description?: string;
  referenceId?: string;
  completedAt?: string;
  failedReason?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Dispute Entity
 */
export interface Dispute {
  id: string;
  _id?: string;
  orderId: string;
  order?: Order;
  customerId: string;
  customerName: string;
  user?: User;
  type: DisputeType | string;
  reason: string;
  description: string;
  images?: string[];
  status: DisputeStatus | string;
  reviewedBy?: string;
  reviewNote?: string;
  resolution?: string;
  resolvedAt?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Review Entity
 */
export interface Review {
  id: string;
  _id?: string;
  productId: string;
  customerId: string;
  customerName: string;
  user?: User;
  orderId?: string;
  rating: number;
  comment: string;
  images?: string[];
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Promotion Entity
 */
export interface Promotion {
  id: string;
  _id?: string;
  code?: string;
  name: string;
  description?: string;
  type: PromotionType | string;
  value: number;
  isActive?: boolean;
  startDate: string;
  endDate: string;
  applicableProducts?: string[];
  applicableCategories?: string[];
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount?: number;
  usedBy?: string[];
  isCodeRequired?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Chat Message
 */
export interface ChatMessage {
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  images?: string[];
  isRead?: boolean;
  sentAt: string;
}

/**
 * Chat Entity
 */
export interface Chat {
  id: string;
  _id?: string;
  customerId: string;
  customerName: string;
  employeeId?: string;
  employeeName?: string;
  messages?: ChatMessage[];
  status: "open" | "closed" | "pending";
  subject?: string;
  lastMessageAt: string;
  isReadByEmployee?: boolean;
  isReadByCustomer?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payment Entity
 */
export interface Payment {
  id: string;
  _id?: string;
  orderId: string;
  amount: number;
  method: PaymentMethod | string;
  status: "pending" | "paid" | "failed" | "refunded" | "UNPAID" | "PAID" | "REFUND_PENDING" | "REFUNDED" | "FAILED";
  transactionId?: string;
  paymentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Inventory Item
 */
export interface InventoryItem {
  id: string;
  _id?: string;
  productId: string;
  productName: string;
  quantity: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  location?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

