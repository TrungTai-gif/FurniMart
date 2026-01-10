/**
 * Auth Guards
 * 
 * Components to protect routes based on authentication and roles.
 */

"use client";

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * AuthGuard - Protects routes that require authentication
 */
export function AuthGuard({ children, redirectTo = "/auth/login" }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      // Save the current path to redirect back after login
      const returnUrl = encodeURIComponent(pathname);
      router.push(`${redirectTo}?returnUrl=${returnUrl}`);
    }
  }, [isAuthenticated, router, pathname, redirectTo]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

/**
 * RoleGuard - Protects routes based on user role
 */
export function RoleGuard({ children, allowedRoles, redirectTo = "/" }: RoleGuardProps) {
  const router = useRouter();
  const { role, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      if (!role || !allowedRoles.includes(role)) {
        router.push(redirectTo);
      }
    }
  }, [role, allowedRoles, isAuthenticated, router, redirectTo]);

  if (!isAuthenticated || !role || !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}

/**
 * PublicOnly - Only allows access when NOT authenticated
 */
export function PublicOnly({ children, redirectTo = "/" }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, router, redirectTo]);

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

