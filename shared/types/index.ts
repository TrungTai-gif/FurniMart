/**
 * Shared Types - Main Export
 * 
 * Central export for all shared types between backend and frontend.
 */

// Enums
export enum UserRole {
  CUSTOMER = 'customer',
  EMPLOYEE = 'employee',
  BRANCH_MANAGER = 'branch_manager',
  SHIPPER = 'shipper',
  ADMIN = 'admin',
}

export enum OrderStatus {
  // Standardized order status flow (0.2)
  // Main flow: PENDING_CONFIRMATION → CONFIRMED → PACKING → READY_TO_SHIP → SHIPPING → DELIVERED → COMPLETED
  // Error branch: CANCELLED, FAILED_DELIVERY, RETURNING, RETURNED
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  CONFIRMED = 'CONFIRMED',
  PACKING = 'PACKING',
  READY_TO_SHIP = 'READY_TO_SHIP',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED_DELIVERY = 'FAILED_DELIVERY',
  RETURNING = 'RETURNING',
  RETURNED = 'RETURNED',
  // Legacy statuses (for backward compatibility)
  NEW = 'NEW',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERY_FAILED = 'DELIVERY_FAILED',
}

export enum PaymentMethod {
  COD = 'cod',
  STRIPE = 'stripe',
  MOMO = 'momo',
  VNPAY = 'vnpay',
  WALLET = 'wallet',
}

export enum DisputeType {
  QUALITY = 'quality',
  DAMAGE = 'damage',
  MISSING = 'missing',
  WRONG_ITEM = 'wrong_item',
  DELIVERY = 'delivery',
  PAYMENT = 'payment',
  OTHER = 'other',
}

export enum DisputeStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
  ESCALATED = 'escalated',
}

export enum WalletTransactionType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  ESCROW_LOCK = 'escrow_lock',
  ESCROW_RELEASE = 'escrow_release',
  ESCROW_REFUND = 'escrow_refund',
  TRANSFER = 'transfer',
}

export enum WalletTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ShippingStatus {
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  DELIVERY_FAILED = 'delivery_failed',
  RETURNED = 'returned',
}

export enum PromotionType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  FREE_SHIPPING = 'free_shipping',
  BUY_X_GET_Y = 'buy_x_get_y',
}

// Export entities
export * from './entities';

// Export responses
export * from './responses';

