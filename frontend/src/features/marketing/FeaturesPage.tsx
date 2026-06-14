import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const featureGroups = [
  {
    title: "Framework command center",
    description: "Track NIS2, ISO 27001, GDPR and custom control sets from a shared compliance workspace.",
    items: ["Readiness scoring", "Control ownership", "Gap prioritization"],
  },
  {
    title: "Evidence operations",
    description: "Collect, review and reuse evidence with clear accountability across teams and audits.",
    items: ["Evidence campaigns", "Review workflows", "Audit history"],
  },
  {
    title: "Vendor and dependency risk",
    description: "Connect suppliers, systems and business processes to understand operational exposure.",
    items: ["Vendor mapping", "System inventory", "Dependency tracking"],
  },
  {
    title: "AI compliance copilot",
    description: "Turn scattered compliance data into recommendations, summaries and practical next actions.",
    items: ["Missing evidence prompts", "Framework guidance", "Executive summaries"],
  },
];

export default function FeaturesPage() {
  return (
    <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 7, md: 10 }, maxWidth: 1240, mx: "auto" }}>
      <Stack spacing={3} sx={{ maxWidth: 780, mb: 7 }}>
        <Chip label="Platform features" color="primary" sx={{ alignSelf: "flex-start" }} />
        <Typography variant="h1" sx={{ fontSize: { xs: 42, md: 64 }, lineHeight: 1 }}>
          Everything needed to run compliance as an operating system.
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
          Framework360 brings frameworks, evidence, vendors, systems, workflows and AI guidance into one clear workspace.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button component={RouterLink} to="/requestdemo" variant="contained" size="large">Request demo</Button>
          <Button component={RouterLink} to="/pricing" variant="outlined" size="large">View pricing</Button>
        </Stack>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2.5 }}>
        {featureGroups.map((feature) => (
          <Paper key={feature.title} sx={{ p: 3.5, borderRadius: 5, height: "100%" }}>
            <Typography variant="h5" gutterBottom>{feature.title}</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>{feature.description}</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {feature.items.map((item) => <Chip key={item} label={item} variant="outlined" />)}
            </Stack>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
