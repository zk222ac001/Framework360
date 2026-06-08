import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "../types/auth";
import { getMe, login as loginRequest, logoutRequest } from "../api/auth";
import { AuthContext } from "./authContext";
// Provides global authentication state and actions to the application.

export function AuthProvider({ children }: { children: ReactNode }) {
  // Stores authenticated user data.
  const [user, setUser] = useState<AuthUser | null>(null);
  // Tracks whether authentication initialization is in progress.
  const [isLoading, setIsLoading] = useState(true);

  // Retrieves current authenticated user from backend session.
  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me);
      // Clear local auth state if session is invalid or expired.
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize authentication state when application loads.
  useEffect(() => {
    // Remove legacy localStorage authentication data.
    localStorage.removeItem("eucompliance_token");
    localStorage.removeItem("eucompliance_user");
    void refreshUser();
  }, [refreshUser]);

  // Handles login request and stores authenticated user state.
  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      const result = await loginRequest({ email, password, rememberMe });
      setUser(result.user);
      return result.user;
    },
    [],
  );

  // Handles logout request and clears local authentication state.
  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Ignore backend logout errors if session already expired.
    } finally {
      setUser(null);
      localStorage.removeItem("eucompliance_token");
      localStorage.removeItem("eucompliance_user");
    }
  }, []);

  // Memoized authentication context value to prevent unnecessary rerenders.
  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshUser,
      setUser,
    }),
    [user, isLoading, login, logout, refreshUser],
  );

  // Makes authentication state available throughout the application.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
