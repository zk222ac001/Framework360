import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CssBaseline from "@mui/material/CssBaseline";
import App from "./App.tsx";
import { ThemeProvider } from "./providers/ThemeProvider.tsx";
import { AuthProvider } from "./context/AuthProvider.tsx";
import "./i18n/i18n";
// Application entry point.

// Mount React app with global providers.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Global theme provider */}
    <ThemeProvider>
      {/* Global authentication provider */}
      <AuthProvider>
        <CssBaseline />
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
