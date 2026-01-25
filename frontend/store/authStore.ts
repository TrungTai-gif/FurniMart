import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, UserRole, AuthResponse } from "@/lib/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  branchId: string | null;
  setAuth: (authData: AuthResponse) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      role: null,
      branchId: null,
      setAuth: (authData: AuthResponse) => {
        set({
          user: authData.user,
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
          isAuthenticated: true,
          role: authData.user.role,
          branchId: authData.user.branchId || null,
        });
        // Set cookies for middleware
        if (typeof document !== "undefined") {
          document.cookie = `accessToken=${authData.accessToken}; path=/; max-age=3600; SameSite=Lax`;
          document.cookie = `refreshToken=${authData.refreshToken}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `role=${authData.user.role}; path=/; max-age=3600; SameSite=Lax`;
          if (authData.user.branchId) {
            document.cookie = `branchId=${authData.user.branchId}; path=/; max-age=3600; SameSite=Lax`;
          }
        }
      },
      setTokens: (accessToken: string, refreshToken: string) => {
        set({
          accessToken,
          refreshToken,
          // Keep isAuthenticated true if we have tokens
          isAuthenticated: !!accessToken && !!refreshToken,
        });
        // Update cookies for middleware
        if (typeof document !== "undefined") {
          document.cookie = `accessToken=${accessToken}; path=/; max-age=3600; SameSite=Lax`;
          document.cookie = `refreshToken=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
        }
      },
      setUser: (user: User) => {
        set({
          user,
          role: user.role,
          branchId: user.branchId || null,
        });
      },
      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          role: null,
          branchId: null,
        });
        // Clear cookies for middleware
        if (typeof document !== "undefined") {
          document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie = "branchId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }
      },
    }),
    {
      name: "auth-storage",
      // Custom merge function to ensure isAuthenticated is calculated correctly
      merge: (persistedState: unknown, currentState: AuthState) => {
    const persisted = persistedState as Partial<AuthState>;
        // If we have accessToken and user in persisted state, set isAuthenticated to true
        const mergedState = { ...currentState, ...persisted };
        if (persisted?.accessToken && persisted?.user) {
          mergedState.isAuthenticated = true;
        } else {
          mergedState.isAuthenticated = false;
        }
        return mergedState;
      },
    }
  )
);

