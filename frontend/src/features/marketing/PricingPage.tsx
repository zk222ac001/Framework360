import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const plans = [
  {
    name: "Starter",
    audience: "For small teams getting audit-ready",
    price: "Talk to us",
    description: "Launch your compliance workspace with framework tracking, evidence overview and readiness dashboards.",
    features: ["Core framework tracking", "Evidence overview", "Readiness dashboard", "Team ownership"],
  },
  {
    name: "Growth",
    audience: "For scaling companies",
    price: "Custom quote",
    description: "Add operational risk visibility with vendor mapping, dependencies, workflows and richer reporting.",
    features: ["Everything in Starter", "Vendor risk center", "System and dependency mapping", "Workflow approvals"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    audience: "For regulated organizations",
    price: "Enterprise quote",
    description: "Support complex compliance programs with custom frameworks, advanced controls and AI assistance.",
    features: ["Everything in Growth", "Custom frameworks", "AI compliance copilot", "Audit-ready exports"],
  },
];

export default function PricingPage() {
  return (
    <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 7, md: 10 }, maxWidth: 1240, mx: "auto" }}>
      <Stack spacing={3} sx={{ maxWidth: 820, mx: "auto", textAlign: "center", mb: 7, alignItems: "center" }}>
        <Chip label="Pricing" color="primary" />
        <Typography variant="h1" sx={{ fontSize: { xs: 42, md: 64 }, lineHeight: 1 }}>
          Simple plans for every compliance maturity stage.
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
          Start with essential framework tracking and scale into vendor risk, AI guidance and enterprise reporting when your program grows.
        </Typography>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2.5, alignItems: "stretch" }}>
        {plans.map((plan) => (
          <Paper
            key={plan.name}
            sx={{
              p: 3.5,
              borderRadius: 5,
              height: "100%",
              border: plan.highlighted ? 2 : 1,
              borderColor: plan.highlighted ? "primary.main" : "divider",
              position: "relative",
            }}
          >
            {plan.highlighted && <Chip label="Most popular" color="primary" sx={{ mb: 2 }} />}
            <Typography variant="h4" gutterBottom>{plan.name}</Typography>
            <Typography color="primary.main" sx={{ fontWeight: 800, mb: 1 }}>{plan.audience}</Typography>
            <Typography variant="h5" sx={{ mb: 2 }}>{plan.price}</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>{plan.description}</Typography>
            <Stack spacing={1.25} sx={{ mb: 4 }}>
              {plan.features.map((feature) => (
                <Typography key={feature} variant="body2">• {feature}</Typography>
              ))}
            </Stack>
            <Button component={RouterLink} to="/requestdemo" variant={plan.highlighted ? "contained" : "outlined"} fullWidth>
              Request demo
            </Button>
          </Paper>
        ))}
      </Box>

      <Paper sx={{ mt: 5, p: { xs: 3, md: 4 }, borderRadius: 5, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, alignItems: { md: "center" }, justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h5" gutterBottom>Need a tailored compliance rollout?</Typography>
          <Typography color="text.secondary">We can help map your frameworks, users, evidence model and onboarding journey before you commit.</Typography>
        </Box>
        <Button component={RouterLink} to="/requestdemo" variant="contained" size="large">Talk to sales</Button>
      </Paper>
    </Box>
  );
}
