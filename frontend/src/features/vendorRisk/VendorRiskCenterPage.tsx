import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getDashboard } from "../../api/dashboard";
import type { DashboardResponse } from "../../types/dashboard";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function riskColor(score: number) {
  if (score >= 90) return "error";
  if (score >= 70) return "warning";
  return "primary";
}

export default function VendorRiskCenterPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getDashboard()
      .then((data) => { if (isMounted) setDashboard(data); })
      .catch((err) => { if (isMounted) setError(getErrorMessage(err)); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const matrix = dashboard?.vendorRisk?.matrix || { critical: 0, high: 0, medium: 0, low: 0 };
  const vendors = useMemo(() => dashboard?.vendorRisk?.criticalVendors || [], [dashboard]);

  if (isLoading) return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ width: "100%", maxWidth: 1180, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 2, md: 4 }, boxSizing: "border-box" }}>
      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 6, mb: 3, position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top left, rgba(239,68,68,.16), transparent 22rem), radial-gradient(circle at bottom right, rgba(37,99,235,.14), transparent 20rem)", pointerEvents: "none" }} />
        <Box sx={{ position: "relative" }}>
          <Chip label="Third-party risk" color="primary" sx={{ mb: 2 }} />
          <Typography variant="h3" gutterBottom>Vendor Risk Center</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 760 }}>Monitor critical suppliers, due diligence pressure and third-party risk concentration across your compliance program.</Typography>
        </Box>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2, mb: 3 }}>
        {Object.entries(matrix).map(([key, value]) => (
          <Paper key={key} sx={{ p: 3, borderRadius: 4, textAlign: "center" }}>
            <Typography variant="h3">{value}</Typography>
            <Typography variant="subtitle2" sx={{ textTransform: "capitalize" }}>{key}</Typography>
            <Typography variant="caption" color="text.secondary">vendor risk bucket</Typography>
          </Paper>
        ))}
      </Box>

      <Paper sx={{ p: 3, borderRadius: 5 }}>
        <Typography variant="h6" gutterBottom>Critical vendor monitoring</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Vendors with the highest operational, security or compliance exposure.</Typography>
        <Stack spacing={1.5}>
          {!vendors.length && <Typography variant="body2" color="text.secondary">No critical vendors registered yet.</Typography>}
          {vendors.map((vendor) => (
            <Box key={vendor.id} sx={{ p: 2, borderRadius: 3, bgcolor: "surface.level2", border: "1px solid", borderColor: "divider" }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{vendor.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{vendor.criticality} criticality</Typography>
                  <LinearProgress variant="determinate" value={vendor.riskScore} sx={{ height: 9, borderRadius: 999, mt: 1.5 }} />
                </Box>
                <Chip label={`${vendor.riskScore} risk`} color={riskColor(vendor.riskScore)} />
              </Stack>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}
