import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import Navbar from "../components/navbar";
// Layout wrapper for authenticated pages.

export default function PrivateLayout() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      {/* Private navigation */}
      <Navbar variant="private" />
      {/* Protected page content */}
      <main>
        <Outlet />
      </main>
    </Box>
  );
}
