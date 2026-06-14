import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const links = [
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
  { label: "Request demo", to: "/requestdemo" },
];

export default function PublicFooter() {
  return (
    <Box component="footer" sx={{ px: { xs: 2, md: 6 }, py: 5, borderTop: 1, borderColor: "divider" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ maxWidth: 1240, mx: "auto", justifyContent: "space-between" }}>
        <Box sx={{ maxWidth: 420 }}>
          <Typography variant="h6" gutterBottom>Framework360</Typography>
          <Typography color="text.secondary">Compliance management for frameworks, evidence, vendors and audit readiness.</Typography>
        </Box>
        <Stack direction="row" spacing={2} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
          {links.map((link) => (
            <Link key={link.to} component={RouterLink} to={link.to} underline="none" color="text.secondary">{link.label}</Link>
          ))}
          <Button component={RouterLink} to="/requestdemo" variant="contained" size="small">Book demo</Button>
        </Stack>
      </Stack>
      <Divider sx={{ my: 3, maxWidth: 1240, mx: "auto" }} />
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 1240, mx: "auto" }}>© {new Date().getFullYear()} Framework360. All rights reserved.</Typography>
    </Box>
  );
}
