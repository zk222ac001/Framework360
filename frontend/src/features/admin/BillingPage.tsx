import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { getAllCompanies } from "../../api/company";
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

function getBillingForPlan(plan?: string | null) {
  return planBilling[plan || "TRIAL"] || planBilling.TRIAL;
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

        <Alert severity="info">
          This billing page is an internal billing overview based on company subscription data. It does not process card payments, generate legal invoices, or sync with a payment gateway yet.
        </Alert>

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
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>No companies found.</TableCell>
                </TableRow>
              )}

              {companies.map((company) => {
                const billing = getBillingForPlan(company.subscriptionPlan);
                const status = getBillingStatus(company);
                const monthlyAmount =
                  company.subscriptionStatus === "ACTIVE" || company.subscriptionStatus === "PAST_DUE"
                    ? billing.monthlyAmount
                    : 0;

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
