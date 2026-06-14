import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const contactOptions = [
  ["Sales", "Request pricing, product fit and rollout guidance."],
  ["Product demo", "See frameworks, evidence, vendor risk and reporting in action."],
  ["Implementation", "Plan onboarding, roles, frameworks and evidence campaigns."],
];

export default function ContactPage() {
  return (
    <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 7, md: 10 }, maxWidth: 1100, mx: "auto" }}>
      <Stack spacing={3} sx={{ maxWidth: 760, mb: 6 }}>
        <Chip label="Contact" color="primary" sx={{ alignSelf: "flex-start" }} />
        <Typography variant="h1" sx={{ fontSize: { xs: 42, md: 62 }, lineHeight: 1 }}>Let us map your compliance journey.</Typography>
        <Typography variant="h6" color="text.secondary">Tell us what frameworks, evidence workflows or audit deadlines you are working toward, and we will help you plan the right next step.</Typography>
        <Button component={RouterLink} to="/requestdemo" variant="contained" size="large" sx={{ alignSelf: "flex-start" }}>Request a demo</Button>
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2.5 }}>
        {contactOptions.map(([title, description]) => (
          <Paper key={title} sx={{ p: 3, borderRadius: 5 }}>
            <Typography variant="h6" gutterBottom>{title}</Typography>
            <Typography color="text.secondary">{description}</Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
