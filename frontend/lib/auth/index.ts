/**
 * Auth Utilities
 * 
 * Centralized authentication utilities.
 */

export * from "./guards";

// Token storage utilities
export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  },

  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  },

  clearTokens: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
};

// Role utilities
export const roles = {
  customer: "customer",
  admin: "admin",
  branch_manager: "branch_manager",
  employee: "employee",
  shipper: "shipper",
} as const;

export type Role = typeof roles[keyof typeof roles];

// Check if user has required role
export const hasRole = (userRole: string | undefined, requiredRoles: string[]): boolean => {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
};

// Get dashboard route by role
export const getDashboardRoute = (role?: string): string => {
  switch (role) {
    case roles.admin:
      return "/admin";
    case roles.branch_manager:
      return "/manager";
    case roles.employee:
      return "/employee";
    case roles.shipper:
      return "/shipper";
    case roles.customer:
      return "/account";
    default:
      return "/";
  }
};

