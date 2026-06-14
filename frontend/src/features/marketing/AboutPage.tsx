import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function AboutPage() {
  return (
    <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 7, md: 10 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack spacing={3} sx={{ maxWidth: 800, mb: 7 }}>
        <Chip label="About Framework360" color="primary" sx={{ alignSelf: 'flex-start' }} />
        <Typography variant="h1" sx={{ fontSize: { xs: 42, md: 64 }, lineHeight: 1 }}>
          Compliance should be understandable, operational and measurable.
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Framework360 was created to help organizations move beyond spreadsheets and disconnected audit activities into a single compliance operating system.
        </Typography>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' }, gap: 2.5 }}>
        <Paper sx={{ p: 3, borderRadius: 5 }}><Typography variant="h6">Our mission</Typography><Typography color="text.secondary">Make compliance easier to manage, easier to explain and easier to improve.</Typography></Paper>
        <Paper sx={{ p: 3, borderRadius: 5 }}><Typography variant="h6">Our approach</Typography><Typography color="text.secondary">Connect frameworks, evidence, systems, vendors and workflows in one platform.</Typography></Paper>
        <Paper sx={{ p: 3, borderRadius: 5 }}><Typography variant="h6">Our outcome</Typography><Typography color="text.secondary">Better audit readiness, stronger governance and clearer executive visibility.</Typography></Paper>
      </Box>
      <Paper sx={{ mt: 5, p: 4, borderRadius: 5 }}>
        <Typography variant="h4" gutterBottom>Built for modern compliance teams</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Whether you are preparing for NIS2, ISO 27001, GDPR assessments or internal governance reviews, Framework360 provides a structured way to coordinate people, evidence and decisions.
        </Typography>
        <Button component={RouterLink} to="/requestdemo" variant="contained">Request a demo</Button>
      </Paper>
    </Box>
  );
}
