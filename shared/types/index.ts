export enum UserRole {
  CUSTOMER = 'customer',
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  SHIPPER = 'shipper',
  ADMIN = 'admin',
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
}

