"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";

/**
 * Hook to ensure auth state is properly initialized after page refresh
 * Waits for zustand persist to restore state from localStorage
 */
export function useAuthInit() {
  const { accessToken, user, refreshToken, role, branchId } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Function to restore cookies from localStorage state
    const restoreCookies = () => {
      const state = useAuthStore.getState();
      
      // If we have tokens and user, restore cookies for middleware
      if (state.accessToken && state.user && typeof document !== "undefined") {
        // Restore cookies that middleware needs
        document.cookie = `accessToken=${state.accessToken}; path=/; max-age=3600; SameSite=Lax`;
        if (state.refreshToken) {
          document.cookie = `refreshToken=${state.refreshToken}; path=/; max-age=604800; SameSite=Lax`;
        }
        if (state.role) {
          document.cookie = `role=${state.role}; path=/; max-age=3600; SameSite=Lax`;
        }
        if (state.branchId) {
          document.cookie = `branchId=${state.branchId}; path=/; max-age=3600; SameSite=Lax`;
        }
        
        // Update isAuthenticated flag
        if (!state.isAuthenticated) {
          useAuthStore.setState({ isAuthenticated: true });
        }
      } else if ((!state.accessToken || !state.user) && state.isAuthenticated) {
        // If we don't have token or user but isAuthenticated is true, set it to false
        useAuthStore.setState({ isAuthenticated: false });
      }
    };

    // Small delay to allow zustand persist to restore state from localStorage
    const timer = setTimeout(() => {
      restoreCookies();
      setIsInitialized(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []); // Only run once on mount

  // Also restore cookies when state changes (e.g., after login)
  useEffect(() => {
    if (accessToken && user && typeof document !== "undefined") {
      document.cookie = `accessToken=${accessToken}; path=/; max-age=3600; SameSite=Lax`;
      if (refreshToken) {
        document.cookie = `refreshToken=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
      }
      if (role) {
        document.cookie = `role=${role}; path=/; max-age=3600; SameSite=Lax`;
      }
      if (branchId) {
        document.cookie = `branchId=${branchId}; path=/; max-age=3600; SameSite=Lax`;
      }
    }
  }, [accessToken, user, refreshToken, role, branchId]);

  return isInitialized;
}

