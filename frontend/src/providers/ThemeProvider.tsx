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
          background: "#0f172a",
          foreground: "#f8fafc",
          surface: "rgba(17, 24, 39, 0.86)",
          surface2: "rgba(31, 41, 55, 0.9)",
          surface3: "#273449",
          border: "rgba(148, 163, 184, 0.24)",
          mutedForeground: "#cbd5e1",
          primary: "#0f766e",
          primaryHover: "#115e59",
          primaryActive: "#134e4a",
          primaryForeground: "#ffffff",
          secondary: "rgba(31, 41, 55, 0.82)",
          secondaryHover: "rgba(39, 52, 73, 0.92)",
          secondaryForeground: "#f8fafc",
          link: "#5eead4",
          linkHover: "#99f6e4",
          success: "#22c55e",
          warning: "#f59e0b",
          destructive: "#ef4444",
          shadow: "0 24px 80px rgba(0, 0, 0, 0.34)",
          softShadow: "0 12px 40px rgba(0, 0, 0, 0.22)",
          focusRing: "rgba(20, 184, 166, 0.32)",
        }
      : {
          background: "#f8fafc",
          foreground: "#0f172a",
          surface: "rgba(255, 255, 255, 0.92)",
          surface2: "#f1f5f9",
          surface3: "#e2e8f0",
          border: "rgba(100, 116, 139, 0.22)",
          mutedForeground: "#64748b",
          primary: "#0f766e",
          primaryHover: "#115e59",
          primaryActive: "#134e4a",
          primaryForeground: "#ffffff",
          secondary: "#f1f5f9",
          secondaryHover: "#e2e8f0",
          secondaryForeground: "#0f172a",
          link: "#0f766e",
          linkHover: "#115e59",
          success: "#16a34a",
          warning: "#d97706",
          destructive: "#dc2626",
          shadow: "0 24px 80px rgba(15, 23, 42, 0.12)",
          softShadow: "0 12px 36px rgba(15, 23, 42, 0.08)",
          focusRing: "rgba(20, 184, 166, 0.22)",
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
        borderRadius: 16,
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
        h1: { fontWeight: 800, letterSpacing: "-0.04em" },
        h2: { fontWeight: 800, letterSpacing: "-0.035em" },
        h3: { fontWeight: 750, letterSpacing: "-0.03em" },
        h4: { fontWeight: 750, letterSpacing: "-0.025em" },
        h5: { fontWeight: 700, letterSpacing: "-0.02em" },
        h6: { fontWeight: 700, letterSpacing: "-0.02em" },
        button: { fontWeight: 700, letterSpacing: "-0.01em" },
      },
      // Global MUI component style overrides.
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: tokens.background,
              backgroundImage: isDark
                ? "radial-gradient(circle at top left, rgba(15, 118, 110, 0.24), transparent 34rem), radial-gradient(circle at top right, rgba(34, 197, 94, 0.12), transparent 32rem)"
                : "radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 32rem), radial-gradient(circle at top right, rgba(34, 197, 94, 0.1), transparent 30rem)",
              backgroundAttachment: "fixed",
              color: tokens.foreground,
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
            },
            "::selection": {
              backgroundColor: tokens.focusRing,
            },
            a: {
              color: tokens.link,
              textDecoration: "none",
              transition: "color 160ms ease",
            },
            "a:hover": {
              color: tokens.linkHover,
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
              backdropFilter: "blur(18px)",
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
              border: `1px solid ${tokens.border}`,
              boxShadow: tokens.softShadow,
              backdropFilter: "blur(16px)",
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              boxShadow: tokens.softShadow,
              borderRadius: 20,
              transition:
                "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: tokens.shadow,
                borderColor: isDark
                  ? "rgba(94, 234, 212, 0.34)"
                  : "rgba(15, 118, 110, 0.24)",
              },
            },
          },
        },
        MuiButton: {
          defaultProps: {
            disableElevation: true,
          },
          styleOverrides: {
            root: {
              borderRadius: 12,
              textTransform: "none",
              fontWeight: 700,
              minHeight: 40,
              transition:
                "transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease",
              "&:hover": {
                transform: "translateY(-1px)",
              },
              "&:focus-visible": {
                boxShadow: `0 0 0 4px ${tokens.focusRing}`,
              },
            },
            containedPrimary: {
              background: `linear-gradient(135deg, ${tokens.primary}, #14b8a6)`,
              boxShadow: isDark
                ? "0 12px 30px rgba(15, 118, 110, 0.28)"
                : "0 12px 30px rgba(15, 118, 110, 0.2)",
              "&:hover": {
                background: `linear-gradient(135deg, ${tokens.primaryHover}, #0d9488)`,
                boxShadow: isDark
                  ? "0 16px 38px rgba(15, 118, 110, 0.34)"
                  : "0 16px 38px rgba(15, 118, 110, 0.26)",
              },
            },
            outlined: {
              borderColor: tokens.border,
              backgroundColor: isDark
                ? "rgba(15, 23, 42, 0.26)"
                : "rgba(255, 255, 255, 0.66)",
              "&:hover": {
                borderColor: tokens.primary,
                backgroundColor: tokens.secondaryHover,
              },
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
                  boxShadow: tokens.softShadow,
                },
              },
            },
          ],
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: 14,
              backgroundColor: isDark
                ? "rgba(15, 23, 42, 0.58)"
                : "rgba(255, 255, 255, 0.86)",
              transition:
                "box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: tokens.border,
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: isDark
                  ? "rgba(94, 234, 212, 0.42)"
                  : "rgba(15, 118, 110, 0.34)",
              },
              "&.Mui-focused": {
                boxShadow: `0 0 0 4px ${tokens.focusRing}`,
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: tokens.primary,
              },
            },
          },
        },
        MuiMenu: {
          styleOverrides: {
            paper: {
              borderRadius: 16,
              boxShadow: tokens.shadow,
            },
          },
        },
        MuiMenuItem: {
          styleOverrides: {
            root: {
              borderRadius: 10,
              margin: "4px 8px",
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 999,
              fontWeight: 700,
            },
          },
        },
        MuiAvatar: {
          styleOverrides: {
            root: {
              background: `linear-gradient(135deg, ${tokens.primary}, #14b8a6)`,
              color: tokens.primaryForeground,
              fontWeight: 800,
            },
          },
        },
        MuiDivider: {
          styleOverrides: {
            root: {
              borderColor: tokens.border,
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
