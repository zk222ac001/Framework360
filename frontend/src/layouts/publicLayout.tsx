import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import Navbar from "../components/navbar";
import PublicFooter from "../components/PublicFooter";
// Layout wrapper for public pages.

export default function PublicLayout() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Public navigation */}
      <Navbar variant="public" />
      {/* Public page content */}
      <Box component="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>
      <PublicFooter />
    </Box>
  );
}
