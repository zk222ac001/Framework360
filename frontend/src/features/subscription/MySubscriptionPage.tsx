import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getMySubscription } from "../../api/subscription";
import type { CompanySubscriptionResponse } from "../../api/subscription";

type MySubscription = CompanySubscriptionResponse["subscription"];

function formatDisplayValue(value?: string | null) {
  return value ? value.replace(/_/g, " ") : "-";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getStatusColor(status?: string | null) {
  if (status === "ACTIVE") return "success";
  if (status === "TRIAL") return "primary";
  if (status === "PAST_DUE") return "warning";
  if (status === "EXPIRED" || status === "CANCELLED" || status === "SUSPENDED") return "error";
  return "default";
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 3, minWidth: 0, height: "100%" }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h6" sx={{ mt: 0.75, fontWeight: 850, overflowWrap: "anywhere" }}>{value}</Typography>
    </Paper>
  );
}

export default function MySubscriptionPage() {
  const [subscription, setSubscription] = useState<MySubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSubscription() {
    try {
      setLoading(true);
      setError("");
      const result = await getMySubscription();
      setSubscription(result.subscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load subscription.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSubscription();
  }, []);

  if (loading) {
    return (
      <Box sx={{ minHeight: "calc(100vh - 72px)", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 1040, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 2, md: 4 }, boxSizing: "border-box" }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" sx={{ fontWeight: 850 }}>Subscription</Typography>
            <Typography color="text.secondary">Current plan and account access for your company.</Typography>
          </Box>
          <Button variant="outlined" onClick={loadSubscription}>Refresh</Button>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        {subscription && (
          <>
            <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, minWidth: 0 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="overline" color="text.secondary">Company</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, overflowWrap: "anywhere" }}>
                    {subscription.companyName}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                  <Chip label={formatDisplayValue(subscription.subscriptionPlan)} color="primary" />
                  <Chip
                    label={formatDisplayValue(subscription.subscriptionStatus)}
                    color={getStatusColor(subscription.subscriptionStatus)}
                  />
                  <Chip
                    label={subscription.allowed ? "Access active" : "Access blocked"}
                    color={subscription.allowed ? "success" : "error"}
                  />
                </Stack>
              </Stack>

              {subscription.reason && (
                <Alert severity={subscription.allowed ? "info" : "warning"} sx={{ mt: 3 }}>
                  {subscription.reason}
                </Alert>
              )}
            </Paper>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
              <DetailTile label="Plan" value={formatDisplayValue(subscription.subscriptionPlan)} />
              <DetailTile label="Status" value={formatDisplayValue(subscription.subscriptionStatus)} />
              <DetailTile label="Renewal date" value={formatDate(subscription.subscriptionRenewal)} />
            </Box>

            <Paper sx={{ p: 3, borderRadius: 4, minWidth: 0 }}>
              <Stack spacing={1.5}>
                <Typography variant="h6" sx={{ fontWeight: 850 }}>Account state</Typography>
                <Divider />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between" }}>
                  <Typography color="text.secondary">Company ID</Typography>
                  <Typography sx={{ fontWeight: 750, overflowWrap: "anywhere" }}>{subscription.companyId}</Typography>
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between" }}>
                  <Typography color="text.secondary">Workspace access</Typography>
                  <Typography sx={{ fontWeight: 750 }}>{subscription.allowed ? "Allowed" : "Blocked"}</Typography>
                </Stack>
              </Stack>
            </Paper>
          </>
        )}
      </Stack>
    </Box>
  );
}
