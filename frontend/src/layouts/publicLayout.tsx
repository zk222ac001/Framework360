import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import Navbar from "../components/navbar";
// Layout wrapper for public pages.

export default function PublicLayout() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      {/* Public navigation */}
      <Navbar variant="public" />
      {/* Public page content */}
      <main>
        <Outlet />
      </main>
    </Box>
  );
}
