// User Types
export interface User {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  role: 'customer' | 'admin' | 'employee' | 'manager' | 'shipper';
  addresses?: Address[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  _id?: string;
  name: string;
  phone: string;
  street: string;
  ward: string;
  district: string;
  city: string;
  isDefault?: boolean;
}

// Product Types
export interface Dimensions {
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  unit?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discount?: number;
  stock: number;
  images?: string[];
  category: string;
  categoryId: string;
  rating?: number;
  reviewCount?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  colors?: string[];
  dimensions?: Dimensions;
  model3d?: string;
  materials?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
}

// Order Types
export interface Order {
  _id: string;
  customerId: string;
  items: OrderItem[];
  shippingAddress: Address | string;
  phone?: string;
  totalPrice: number;
  totalDiscount?: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentMethod: 'cod' | 'stripe' | 'momo' | string;
  isPaid: boolean; // Changed from paymentStatus
  notes?: string;
  shipperId?: string;
  trackingNumber?: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
}

// Review Types
export interface Review {
  _id: string;
  productId: string;
  customerId: string;
  rating: number;
  comment?: string;
  images?: string[];
  createdAt: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

