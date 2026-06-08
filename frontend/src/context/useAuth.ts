import { useContext } from "react";
import { AuthContext } from "./authContext";
// Custom hook for accessing authentication context.

export function useAuth() {
  const context = useContext(AuthContext);

  // Prevent usage outside AuthProvider.
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  // Returns shared authentication state and actions.
  return context;
}
