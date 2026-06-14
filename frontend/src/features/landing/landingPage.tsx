import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const platformFeatures = [
  ["Real-time readiness", "Visualize framework maturity, evidence coverage and open gaps in one executive dashboard."],
  ["Evidence operations", "Centralize uploads, ownership, review status and audit-ready documentation."],
  ["Vendor risk center", "Map vendors to systems, dependencies and compliance impact before risk becomes invisible."],
  ["AI guidance", "Surface missing evidence, framework recommendations and practical next actions."],
];

const pricingPlans = [
  ["Starter", "For small teams", "Framework tracking, evidence overview, readiness dashboards"],
  ["Growth", "For scaling companies", "Vendor risk, dependency mapping, activity timeline, advanced reporting"],
  ["Enterprise", "For regulated organizations", "SSO, custom frameworks, audit exports, AI compliance assistant"],
];

export default function LandingPage() {
  return (
    <Box sx={{ minHeight: "100vh", color: "text.primary" }}>
      <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 7, md: 11 }, position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 12% 18%, rgba(37, 99, 235, 0.2), transparent 28rem), radial-gradient(circle at 84% 8%, rgba(20, 184, 166, 0.18), transparent 26rem)", pointerEvents: "none" }} />
        <Stack direction={{ xs: "column", lg: "row" }} spacing={6} sx={{ position: "relative", maxWidth: 1240, mx: "auto", alignItems: "center" }}>
          <Box sx={{ flex: 1 }}>
            <Chip label="Compliance command center for modern teams" color="primary" sx={{ mb: 2 }} />
            <Typography variant="h1" sx={{ fontSize: { xs: 44, md: 72 }, lineHeight: 0.95, mb: 3 }}>
              Turn compliance into a clear operating system.
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 660, mb: 4, fontWeight: 500 }}>
              Framework360 helps teams manage frameworks, evidence, vendors, dependencies and audit readiness from one modern platform.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button component={RouterLink} to="/requestdemo" variant="contained" size="large">Request demo</Button>
              <Button component={RouterLink} to="/login" variant="outlined" size="large">Open workspace</Button>
            </Stack>
          </Box>

          <Paper sx={{ flex: 1, width: "100%", p: 3, borderRadius: 7, overflow: "hidden" }}>
            <Stack spacing={2.5}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="overline" color="text.secondary">Executive overview</Typography>
                  <Typography variant="h4">87% ready</Typography>
                </Box>
                <Chip label="Audit-ready" color="success" />
              </Stack>
              <Box sx={{ height: 14, borderRadius: 999, background: "linear-gradient(90deg, #2563eb 0%, #14b8a6 87%, rgba(148,163,184,.25) 87%)" }} />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                {["NIS2", "ISO 27001", "GDPR"].map((item, index) => (
                  <Paper key={item} sx={{ p: 2, flex: 1, borderRadius: 4, bgcolor: "surface.level2" }}>
                    <Typography variant="subtitle2">{item}</Typography>
                    <Typography variant="h5">{[92, 81, 88][index]}%</Typography>
                    <Typography variant="caption" color="text.secondary">readiness</Typography>
                  </Paper>
                ))}
              </Stack>
              <Paper sx={{ p: 2.5, borderRadius: 4, bgcolor: "surface.level2" }}>
                <Typography variant="subtitle2" gutterBottom>AI recommendation</Typography>
                <Typography variant="body2" color="text.secondary">Upload vendor incident response evidence for two critical suppliers to improve audit coverage.</Typography>
              </Paper>
            </Stack>
          </Paper>
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 2, md: 6 }, py: 7, maxWidth: 1240, mx: "auto" }}>
        <Typography variant="h3" sx={{ mb: 1 }}>Built for evidence-driven compliance</Typography>
        <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 700 }}>Everything your team needs to move from spreadsheet tracking to operational compliance management.</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2.5 }}>
          {platformFeatures.map(([title, description]) => (
            <Paper key={title} sx={{ p: 3, borderRadius: 5 }}>
              <Typography variant="h6" gutterBottom>{title}</Typography>
              <Typography variant="body2" color="text.secondary">{description}</Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, md: 6 }, py: 7, maxWidth: 1240, mx: "auto" }}>
        <Typography variant="h3" sx={{ mb: 1 }}>Simple plans for every maturity stage</Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>Start with core framework tracking and scale into vendor risk, AI guidance and enterprise reporting.</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2.5 }}>
          {pricingPlans.map(([name, audience, details]) => (
            <Paper key={name} sx={{ p: 3, borderRadius: 5 }}>
              <Typography variant="h5" gutterBottom>{name}</Typography>
              <Typography color="primary.main" sx={{ fontWeight: 800, mb: 2 }}>{audience}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{details}</Typography>
              <Button component={RouterLink} to="/requestdemo" variant={name === "Growth" ? "contained" : "outlined"} fullWidth>Talk to us</Button>
            </Paper>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
