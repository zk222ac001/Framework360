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
import { getAllCompanies } from "../../api/company";
import {
  updateCompanySubscription,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from "../../api/subscription";
import type { Company } from "../../types/companyTypes";

type SubscriptionFormValues = {
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  subscriptionRenewal: string;
};

const subscriptionPlans: SubscriptionPlan[] = [
  "TRIAL",
  "STARTER",
  "PROFESSIONAL",
  "ENTERPRISE",
];

const subscriptionStatuses: SubscriptionStatus[] = [
  "TRIAL",
  "ACTIVE",
  "PAST_DUE",
  "EXPIRED",
  "CANCELLED",
  "SUSPENDED",
];

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function toFormValues(company: Company): SubscriptionFormValues {
  return {
    subscriptionPlan: (company.subscriptionPlan as SubscriptionPlan) || "TRIAL",
    subscriptionStatus: (company.subscriptionStatus as SubscriptionStatus) || "TRIAL",
    subscriptionRenewal: toDateInputValue(company.subscriptionRenewal),
  };
}

function isBlockedStatus(status?: string | null) {
  return status === "EXPIRED" || status === "CANCELLED" || status === "SUSPENDED";
}

export default function SubscriptionManagementPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formValues, setFormValues] = useState<Record<string, SubscriptionFormValues>>({});
  const [loading, setLoading] = useState(true);
  const [savingCompanyId, setSavingCompanyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const totals = useMemo(() => {
    return companies.reduce(
      (acc, company) => {
        const status = company.subscriptionStatus || "UNKNOWN";
        acc.total += 1;
        if (status === "ACTIVE") acc.active += 1;
        if (status === "TRIAL") acc.trial += 1;
        if (isBlockedStatus(status)) acc.blocked += 1;
        return acc;
      },
      { total: 0, active: 0, trial: 0, blocked: 0 },
    );
  }, [companies]);

  async function loadCompanies() {
    try {
      setLoading(true);
      setError("");
      const result = await getAllCompanies();
      setCompanies(result);
      setFormValues(
        result.reduce<Record<string, SubscriptionFormValues>>((acc, company) => {
          acc[company.id] = toFormValues(company);
          return acc;
        }, {}),
      );
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not load companies.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  function handleChange(company: Company, field: keyof SubscriptionFormValues) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const current = formValues[company.id] || toFormValues(company);
      setFormValues((prev) => ({
        ...prev,
        [company.id]: {
          ...current,
          [field]: event.target.value,
        },
      }));
    };
  }

  async function handleSave(company: Company) {
    const values = formValues[company.id] || toFormValues(company);

    try {
      setSavingCompanyId(company.id);
      setError("");
      setSuccess("");

      await updateCompanySubscription(company.id, {
        subscriptionPlan: values.subscriptionPlan,
        subscriptionStatus: values.subscriptionStatus,
        subscriptionRenewal: values.subscriptionRenewal
          ? new Date(`${values.subscriptionRenewal}T00:00:00.000Z`).toISOString()
          : null,
      });

      setSuccess(`Subscription updated for ${company.name}.`);
      await loadCompanies();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not update subscription.");
    } finally {
      setSavingCompanyId(null);
    }
  }

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
            Subscription Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage company plans, subscription status, and renewal dates from one place.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Paper sx={{ p: 2, borderRadius: 3, minWidth: 160 }}>
            <Typography variant="caption" color="text.secondary">Companies</Typography>
            <Typography variant="h5">{totals.total}</Typography>
          </Paper>
          <Paper sx={{ p: 2, borderRadius: 3, minWidth: 160 }}>
            <Typography variant="caption" color="text.secondary">Active</Typography>
            <Typography variant="h5">{totals.active}</Typography>
          </Paper>
          <Paper sx={{ p: 2, borderRadius: 3, minWidth: 160 }}>
            <Typography variant="caption" color="text.secondary">Trial</Typography>
            <Typography variant="h5">{totals.trial}</Typography>
          </Paper>
          <Paper sx={{ p: 2, borderRadius: 3, minWidth: 160 }}>
            <Typography variant="caption" color="text.secondary">Blocked</Typography>
            <Typography variant="h5">{totals.blocked}</Typography>
          </Paper>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Renewal</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>No companies found.</TableCell>
                </TableRow>
              )}

              {companies.map((company) => {
                const values = formValues[company.id] || toFormValues(company);
                const blocked = isBlockedStatus(values.subscriptionStatus);

                return (
                  <TableRow key={company.id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          {company.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {company.cvr || "No CVR"}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{company.country || "-"}</TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={values.subscriptionPlan}
                        onChange={handleChange(company, "subscriptionPlan")}
                        sx={{ minWidth: 160 }}
                      >
                        {subscriptionPlans.map((plan) => (
                          <MenuItem key={plan} value={plan}>{plan}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <TextField
                          select
                          size="small"
                          value={values.subscriptionStatus}
                          onChange={handleChange(company, "subscriptionStatus")}
                          sx={{ minWidth: 160 }}
                        >
                          {subscriptionStatuses.map((status) => (
                            <MenuItem key={status} value={status}>{status}</MenuItem>
                          ))}
                        </TextField>
                        {blocked && <Chip label="Blocked" color="error" size="small" />}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="date"
                        size="small"
                        value={values.subscriptionRenewal}
                        onChange={handleChange(company, "subscriptionRenewal")}
                        InputLabelProps={{ shrink: true }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        disabled={savingCompanyId === company.id}
                        onClick={() => handleSave(company)}
                      >
                        {savingCompanyId === company.id ? "Saving..." : "Save"}
                      </Button>
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
