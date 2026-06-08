import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { createTheme } from "@mui/material/styles";
import {
  ThemeContext,
  type Theme,
  type ThemeContextType,
} from "./theme-context";
// Provides MUI theme configuration and custom light/dark mode handling.

// Extend MUI palette with custom design tokens.
declare module "@mui/material/styles" {
  interface Palette {
    surface: {
      main: string;
      level2: string;
      level3: string;
    };
    neutralButton: {
      bg: string;
      hover: string;
      text: string;
      border: string;
    };
  }

  interface PaletteOptions {
    surface?: {
      main: string;
      level2: string;
      level3: string;
    };
    neutralButton?: {
      bg: string;
      hover: string;
      text: string;
      border: string;
    };
  }
}

// Adds custom soft button variant to MUI Button.
declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    soft: true;
  }
}

// Reads saved theme from localStorage and falls back to dark mode.
function getInitialTheme(): Theme {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }
  return "dark";
}

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeMode, setThemeState] = useState<Theme>(() => getInitialTheme());

  // Updates theme state and persists preference locally.
  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  // Switches between light and dark mode.
  const toggleTheme = () => {
    setTheme(themeMode === "dark" ? "light" : "dark");
  };

  const value: ThemeContextType = {
    theme: themeMode,
    setTheme,
    toggleTheme,
  };

  // Builds MUI theme whenever selected theme mode changes.
  const muiTheme = useMemo(() => {
    // Theme design tokens for dark and light mode.
    const isDark = themeMode === "dark";

    const tokens = isDark
      ? {
          background: "#111113",
          foreground: "#eeeef0",
          surface: "#111725",
          surface2: "#222325",
          surface3: "#292a2e",
          border: "#393a40",
          mutedForeground: "#b2b3bd",
          primary: "#3d63dd",
          primaryHover: "#3f5cb0",
          primaryActive: "#405eb2",
          primaryForeground: "#ffffff",
          secondary: "#222325",
          secondaryHover: "#292a2e",
          secondaryForeground: "#eeeef0",
          link: "#93b4ff",
          linkHover: "#d5e2ff",
          success: "#22c55e",
          warning: "#f59e0b",
          destructive: "#ef4444",
        }
      : {
          background: "#fcfcfd",
          foreground: "#1e1f24",
          surface: "#f9f9fb",
          surface2: "#eff0f3",
          surface3: "#e7e8ec",
          border: "#d8d9e0",
          mutedForeground: "#62636c",
          primary: "#3d63dd",
          primaryHover: "#3657c3",
          primaryActive: "#3657c3",
          primaryForeground: "#ffffff",
          secondary: "#eff0f3",
          secondaryHover: "#e7e8ec",
          secondaryForeground: "#1e1f24",
          link: "#395bc7",
          linkHover: "#3657c3",
          success: "#16a34a",
          warning: "#d97706",
          destructive: "#dc2626",
        };

    return createTheme({
      palette: {
        mode: isDark ? "dark" : "light",
        primary: {
          main: tokens.primary,
          light: tokens.primaryHover,
          dark: tokens.primaryActive,
          contrastText: tokens.primaryForeground,
        },
        secondary: {
          main: tokens.secondary,
          light: tokens.secondaryHover,
          dark: tokens.secondary,
          contrastText: tokens.secondaryForeground,
        },
        background: {
          default: tokens.background,
          paper: tokens.surface,
        },
        text: {
          primary: tokens.foreground,
          secondary: tokens.mutedForeground,
        },
        divider: tokens.border,
        success: { main: tokens.success },
        warning: { main: tokens.warning },
        error: { main: tokens.destructive },
        surface: {
          main: tokens.surface,
          level2: tokens.surface2,
          level3: tokens.surface3,
        },
        neutralButton: {
          bg: tokens.secondary,
          hover: tokens.secondaryHover,
          text: tokens.secondaryForeground,
          border: tokens.border,
        },
      },
      shape: {
        borderRadius: 12,
      },
      typography: {
        fontFamily: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ].join(","),
      },
      // Global MUI component style overrides.
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: tokens.background,
              color: tokens.foreground,
            },
            a: {
              color: tokens.link,
              textDecoration: "none",
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: tokens.surface,
              borderBottom: `1px solid ${tokens.border}`,
              boxShadow: "none",
              backgroundImage: "none",
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              boxShadow: "none",
            },
          },
        },
        MuiButton: {
          defaultProps: {
            disableElevation: true,
          },
          styleOverrides: {
            root: {
              borderRadius: 10,
              textTransform: "none",
              fontWeight: 600,
            },
          },
          variants: [
            {
              props: { variant: "soft" },
              style: {
                backgroundColor: tokens.secondary,
                color: tokens.secondaryForeground,
                border: `1px solid ${tokens.border}`,
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: tokens.secondaryHover,
                  boxShadow: "none",
                },
              },
            },
          ],
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              backgroundColor: isDark ? "#19191b" : "#ffffff",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: tokens.border,
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: tokens.border,
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: tokens.primary,
              },
            },
          },
        },
      },
    });
  }, [themeMode]);

  {
    /* Provide custom theme context and MUI theme to the app */
  }
  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
