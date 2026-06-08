import { createContext } from "react";
import type { AuthUser } from "../types/auth";
// Authentication context shared across the application.

// Defines all authentication state and actions exposed through context.
export type AuthContextValue = {
  // Currently authenticated user.
  user: AuthUser | null;
  // Indicates whether a user session exists.
  isAuthenticated: boolean;
  // Indicates whether authentication state is still being resolved.
  isLoading: boolean;

  // Authenticates user and stores session state.
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<AuthUser>;
  // Clears authenticated session.
  logout: () => Promise<void>;
  // Refreshes authenticated user from backend session cookie.
  refreshUser: () => Promise<void>;
  // Allows direct manual update of auth user state.
  setUser: (user: AuthUser | null) => void;
};

// React context used by AuthProvider and useAuth hook.
export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
