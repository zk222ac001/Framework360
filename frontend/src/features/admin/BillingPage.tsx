import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import LaunchIcon from "@mui/icons-material/Launch";
import PaymentIcon from "@mui/icons-material/Payment";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  createCheckoutSession,
  createCustomerPortalSession,
} from "../../api/billing";
import { getAllCompanies } from "../../api/company";
import type { SubscriptionPlan } from "../../api/subscription";
import type { Company } from "../../types/companyTypes";

type PlanBilling = {
  label: string;
  monthlyAmount: number;
  currency: string;
};

const planBilling: Record<string, PlanBilling> = {
  TRIAL: { label: "Trial", monthlyAmount: 0, currency: "DKK" },
  STARTER: { label: "Starter", monthlyAmount: 499, currency: "DKK" },
  PROFESSIONAL: { label: "Professional", monthlyAmount: 1499, currency: "DKK" },
  ENTERPRISE: { label: "Enterprise", monthlyAmount: 4999, currency: "DKK" },
};

const checkoutPlans: Exclude<SubscriptionPlan, "TRIAL">[] = [
  "STARTER",
  "PROFESSIONAL",
  "ENTERPRISE",
];

function getBillingForPlan(plan?: string | null) {
  return planBilling[plan || "TRIAL"] || planBilling.TRIAL;
}

function getCheckoutPlan(company: Company): Exclude<SubscriptionPlan, "TRIAL"> {
  const plan = String(company.subscriptionPlan || "").toUpperCase();
  return checkoutPlans.includes(plan as Exclude<SubscriptionPlan, "TRIAL">)
    ? (plan as Exclude<SubscriptionPlan, "TRIAL">)
    : "PROFESSIONAL";
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function getBillingStatus(company: Company) {
  const status = company.subscriptionStatus || "TRIAL";
  if (status === "ACTIVE") return { label: "Billable", color: "success" as const };
  if (status === "TRIAL") return { label: "Trial", color: "info" as const };
  if (status === "PAST_DUE") return { label: "Past due", color: "warning" as const };
  if (status === "EXPIRED" || status === "CANCELLED" || status === "SUSPENDED") {
    return { label: "Blocked", color: "error" as const };
  }
  return { label: status, color: "default" as const };
}

export default function BillingPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPlans, setSelectedPlans] = useState<
    Record<string, Exclude<SubscriptionPlan, "TRIAL">>
  >({});
  const [runningAction, setRunningAction] = useState<string | null>(null);

  const billingSummary = useMemo(() => {
    return companies.reduce(
      (acc, company) => {
        const billing = getBillingForPlan(company.subscriptionPlan);
        const status = company.subscriptionStatus || "TRIAL";
        const isBillable = status === "ACTIVE";
        const isTrial = status === "TRIAL";
        const isPastDue = status === "PAST_DUE";

        acc.totalCompanies += 1;
        if (isBillable) acc.billableCompanies += 1;
        if (isTrial) acc.trialCompanies += 1;
        if (isPastDue) acc.pastDueCompanies += 1;
        if (isBillable || isPastDue) acc.estimatedMonthlyRevenue += billing.monthlyAmount;
        return acc;
      },
      {
        totalCompanies: 0,
        billableCompanies: 0,
        trialCompanies: 0,
        pastDueCompanies: 0,
        estimatedMonthlyRevenue: 0,
      },
    );
  }, [companies]);

  async function loadCompanies() {
    try {
      setLoading(true);
      setError("");
      const result = await getAllCompanies();
      setCompanies(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not load billing data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout(company: Company) {
    try {
      setError("");
      setRunningAction(`checkout:${company.id}`);
      const plan = selectedPlans[company.id] || getCheckoutPlan(company);
      const result = await createCheckoutSession({ companyId: company.id, plan });
      window.location.assign(result.url);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not start Stripe checkout.");
    } finally {
      setRunningAction(null);
    }
  }

  async function handleCustomerPortal(company: Company) {
    try {
      setError("");
      setRunningAction(`portal:${company.id}`);
      const result = await createCustomerPortalSession(company.id);
      window.location.assign(result.url);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not open Stripe customer portal.");
    } finally {
      setRunningAction(null);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Billing
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View billing readiness, plan amounts, renewal dates, and estimated monthly recurring revenue.
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Paper sx={{ p: 2, borderRadius: 3, minWidth: 180 }}>
            <Typography variant="caption" color="text.secondary">Estimated MRR</Typography>
            <Typography variant="h5">
              {formatMoney(billingSummary.estimatedMonthlyRevenue, "DKK")}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, borderRadius: 3, minWidth: 180 }}>
            <Typography variant="caption" color="text.secondary">Billable companies</Typography>
            <Typography variant="h5">{billingSummary.billableCompanies}</Typography>
          </Paper>
          <Paper sx={{ p: 2, borderRadius: 3, minWidth: 180 }}>
            <Typography variant="caption" color="text.secondary">Trial companies</Typography>
            <Typography variant="h5">{billingSummary.trialCompanies}</Typography>
          </Paper>
          <Paper sx={{ p: 2, borderRadius: 3, minWidth: 180 }}>
            <Typography variant="caption" color="text.secondary">Past due</Typography>
            <Typography variant="h5">{billingSummary.pastDueCompanies}</Typography>
          </Paper>
        </Stack>

        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Monthly amount</TableCell>
                <TableCell>Renewal / next billing date</TableCell>
                <TableCell>Billing note</TableCell>
                <TableCell align="right">Stripe</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>No companies found.</TableCell>
                </TableRow>
              )}

              {companies.map((company) => {
                const billing = getBillingForPlan(company.subscriptionPlan);
                const status = getBillingStatus(company);
                const monthlyAmount =
                  company.subscriptionStatus === "ACTIVE" || company.subscriptionStatus === "PAST_DUE"
                    ? billing.monthlyAmount
                    : 0;
                const checkoutPlan = selectedPlans[company.id] || getCheckoutPlan(company);
                const checkoutLoading = runningAction === `checkout:${company.id}`;
                const portalLoading = runningAction === `portal:${company.id}`;

                return (
                  <TableRow key={company.id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{company.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{company.country || "No country"}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{billing.label}</TableCell>
                    <TableCell>
                      <Chip label={status.label} color={status.color} size="small" />
                    </TableCell>
                    <TableCell>{formatMoney(monthlyAmount, billing.currency)}</TableCell>
                    <TableCell>{formatDate(company.subscriptionRenewal)}</TableCell>
                    <TableCell>
                      {company.subscriptionStatus === "TRIAL" && "Trial account - not billable yet"}
                      {company.subscriptionStatus === "ACTIVE" && "Ready for billing"}
                      {company.subscriptionStatus === "PAST_DUE" && "Needs payment follow-up"}
                      {(company.subscriptionStatus === "EXPIRED" || company.subscriptionStatus === "CANCELLED" || company.subscriptionStatus === "SUSPENDED") && "Access blocked or cancelled"}
                      {!company.subscriptionStatus && "Missing subscription status"}
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction={{ xs: "column", lg: "row" }}
                        spacing={1}
                        sx={{
                          justifyContent: "flex-end",
                          alignItems: { xs: "stretch", lg: "center" },
                        }}
                      >
                        <TextField
                          select
                          size="small"
                          value={checkoutPlan}
                          onChange={(event) =>
                            setSelectedPlans((prev) => ({
                              ...prev,
                              [company.id]: event.target.value as Exclude<SubscriptionPlan, "TRIAL">,
                            }))
                          }
                          sx={{ minWidth: 150 }}
                        >
                          {checkoutPlans.map((plan) => (
                            <MenuItem key={plan} value={plan}>
                              {planBilling[plan].label}
                            </MenuItem>
                          ))}
                        </TextField>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={checkoutLoading ? <CircularProgress size={16} /> : <PaymentIcon />}
                          endIcon={<LaunchIcon />}
                          disabled={Boolean(runningAction)}
                          onClick={() => handleCheckout(company)}
                        >
                          Checkout
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={portalLoading ? <CircularProgress size={16} /> : <SettingsIcon />}
                          endIcon={<LaunchIcon />}
                          disabled={Boolean(runningAction)}
                          onClick={() => handleCustomerPortal(company)}
                        >
                          Portal
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Box>
  );
}
