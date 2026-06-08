import { createContext, useContext } from "react";
// Theme context used to share light/dark mode state across the app.

// Supported theme modes.
export type Theme = "dark" | "light";

// Theme state and actions exposed through context.
export type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType | null>(null);

// Custom hook for accessing theme context.
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  // Prevent usage outside ThemeProvider.
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
