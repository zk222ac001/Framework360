import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  createAuditorGrant,
  deleteAuditorGrant,
  getAuditorEvidence,
  getAuditorGrants,
  getAuditorOverview,
  updateAuditorGrant,
  type AuditorAccessGrant,
  type AuditorEvidence,
  type AuditorOverview,
} from "../../api/auditorPortal";
import { useAuth } from "../../context/useAuth";

const defaultScope = {
  frameworks: true,
  evidence: true,
  findings: true,
  trustCenter: true,
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function statusColor(status?: string): "success" | "warning" | "error" | "default" {
  if (status === "ACTIVE" || status === "APPROVED") return "success";
  if (status === "PAUSED" || status === "IN_REVIEW" || status === "REQUESTED") return "warning";
  if (status === "EXPIRED" || status === "REJECTED") return "error";
  return "default";
}

function formatDate(value?: string | null) {
  if (!value) return "No expiry";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function AuditorPortalPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<AuditorOverview | null>(null);
  const [evidence, setEvidence] = useState<AuditorEvidence[]>([]);
  const [grants, setGrants] = useState<AuditorAccessGrant[]>([]);
  const [grantForm, setGrantForm] = useState({
    email: "",
    name: "",
    expiresAt: "",
    scope: defaultScope,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const canManageAuditors = user?.role === "CUSTOMER_ADMIN" || user?.role === "COMPLIANCE_MANAGER" || user?.role === "PLATFORM_ADMIN";

  async function loadData() {
    setError(null);
    try {
      const [overviewData, evidenceData, grantsData] = await Promise.all([
        getAuditorOverview(),
        getAuditorEvidence(),
        getAuditorGrants().catch(() => ({ grants: [] })),
      ]);
      setOverview(overviewData);
      setEvidence(evidenceData.evidence);
      setGrants(grantsData.grants);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const latestEvidence = useMemo(() => evidence.slice(0, 8), [evidence]);

  function toggleScope(key: keyof typeof defaultScope) {
    setGrantForm((current) => ({
      ...current,
      scope: {
        ...current.scope,
        [key]: !current.scope[key],
      },
    }));
  }

  async function handleCreateGrant() {
    if (!grantForm.email.trim()) return;

    setBusyId("new");
    setError(null);
    setNotice(null);
    try {
      await createAuditorGrant({
        email: grantForm.email.trim(),
        name: grantForm.name.trim() || null,
        expiresAt: grantForm.expiresAt || null,
        status: "ACTIVE",
        scope: grantForm.scope,
      });
      setGrantForm({ email: "", name: "", expiresAt: "", scope: defaultScope });
      setNotice("Auditor access created.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleGrantStatus(grant: AuditorAccessGrant, status: "ACTIVE" | "PAUSED" | "EXPIRED") {
    setBusyId(grant.id);
    setError(null);
    setNotice(null);
    try {
      await updateAuditorGrant(grant.id, { status });
      setNotice("Auditor access updated.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteGrant(grant: AuditorAccessGrant) {
    if (!window.confirm(`Remove auditor access for ${grant.email}?`)) return;

    setBusyId(grant.id);
    setError(null);
    setNotice(null);
    try {
      await deleteAuditorGrant(grant.id);
      setNotice("Auditor access removed.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 1240, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 2, md: 4 } }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Chip label="Read-only audit workspace" color="primary" sx={{ alignSelf: "flex-start" }} />
        <Typography variant="h4">Auditor portal</Typography>
        <Typography color="text.secondary">
          Give auditors a controlled view of readiness, evidence, open findings, frameworks, and Trust Center status.
        </Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}

      {overview && (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2, mb: 3 }}>
            {[
              ["Readiness", `${overview.summary.readinessScore}%`],
              ["Controls", overview.summary.controls],
              ["Evidence", overview.summary.evidence],
              ["Open findings", overview.summary.openFindings],
            ].map(([label, value]) => (
              <Paper key={label} sx={{ p: 2.5, borderRadius: 4 }}>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 850 }}>{value}</Typography>
              </Paper>
            ))}
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2.5, mb: 3 }}>
            <Paper sx={{ p: 3, borderRadius: 5 }}>
              <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Box>
                  <Typography variant="h6">{overview.company.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {[overview.company.sector, overview.company.country].filter(Boolean).join(" - ") || "Company audit profile"}
                  </Typography>
                </Box>
                <Chip
                  label={overview.summary.publishedTrustCenter ? "Trust Center live" : "Trust Center private"}
                  color={overview.summary.publishedTrustCenter ? "success" : "default"}
                />
              </Stack>
              <Stack spacing={1.25}>
                {overview.frameworks.map((framework) => (
                  <Box key={framework.id} sx={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 1.5, alignItems: "center" }}>
                    <Typography variant="body2" sx={{ fontWeight: 750 }}>{framework.framework}</Typography>
                    <Chip label={`${framework.score}%`} color={framework.score >= 80 ? "success" : "warning"} size="small" />
                    <Typography variant="caption" color="text.secondary">{framework.controls} controls</Typography>
                  </Box>
                ))}
                {!overview.frameworks.length && <Alert severity="info">No frameworks enabled yet.</Alert>}
              </Stack>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 5 }}>
              <Typography variant="h6" gutterBottom>Open auditor findings</Typography>
              <Stack spacing={1.25}>
                {overview.findings.slice(0, 6).map((finding) => (
                  <Box key={finding.id} sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 1.25 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 750 }}>{finding.title}</Typography>
                      <Chip label={finding.priority} size="small" color={statusColor(finding.priority)} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {finding.control ? `${finding.control.framework} ${finding.control.reference}` : finding.status}
                      {finding.owner ? ` - ${finding.owner}` : ""}
                    </Typography>
                  </Box>
                ))}
                {!overview.findings.length && <Alert severity="success">No open findings.</Alert>}
              </Stack>
            </Paper>
          </Box>
        </>
      )}

      {canManageAuditors && (
        <Paper sx={{ p: 3, borderRadius: 5, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Invite auditor</Typography>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ mb: 2 }}>
            <TextField label="Auditor email" value={grantForm.email} onChange={(event) => setGrantForm({ ...grantForm, email: event.target.value })} fullWidth />
            <TextField label="Name" value={grantForm.name} onChange={(event) => setGrantForm({ ...grantForm, name: event.target.value })} fullWidth />
            <TextField label="Expires" type="date" value={grantForm.expiresAt} onChange={(event) => setGrantForm({ ...grantForm, expiresAt: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 190 }} />
            <Button variant="contained" disabled={!grantForm.email.trim() || busyId === "new"} onClick={handleCreateGrant}>Create access</Button>
          </Stack>
          <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap" }}>
            {Object.keys(defaultScope).map((key) => (
              <FormControlLabel
                key={key}
                control={<Switch checked={grantForm.scope[key as keyof typeof defaultScope]} onChange={() => toggleScope(key as keyof typeof defaultScope)} />}
                label={key}
              />
            ))}
          </Stack>
        </Paper>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: canManageAuditors ? "1fr 1fr" : "1fr" }, gap: 2.5 }}>
        {canManageAuditors && (
          <Paper sx={{ p: 3, borderRadius: 5 }}>
            <Typography variant="h6" gutterBottom>Access grants</Typography>
            <Stack spacing={1.5}>
              {grants.map((grant) => (
                <Box key={grant.id} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between" }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{grant.name || grant.email}</Typography>
                      <Typography variant="caption" color="text.secondary">{grant.email} - {formatDate(grant.expiresAt)}</Typography>
                    </Box>
                    <Chip label={grant.status} color={statusColor(grant.status)} size="small" sx={{ alignSelf: { xs: "flex-start", sm: "center" } }} />
                  </Stack>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mt: 1.5 }}>
                    {Object.entries(grant.scope || {}).filter(([, enabled]) => enabled).map(([scope]) => (
                      <Chip key={scope} label={scope} size="small" variant="outlined" />
                    ))}
                  </Stack>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.5 }}>
                    <TextField select size="small" label="Status" value={grant.status} onChange={(event) => handleGrantStatus(grant, event.target.value as "ACTIVE" | "PAUSED" | "EXPIRED")} sx={{ minWidth: 150 }}>
                      {["ACTIVE", "PAUSED", "EXPIRED"].map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                    </TextField>
                    <Button color="error" variant="outlined" disabled={busyId === grant.id} onClick={() => handleDeleteGrant(grant)}>Remove</Button>
                  </Stack>
                </Box>
              ))}
              {!grants.length && <Alert severity="info">No auditor access grants yet.</Alert>}
            </Stack>
          </Paper>
        )}

        <Paper sx={{ p: 3, borderRadius: 5 }}>
          <Typography variant="h6" gutterBottom>Recent evidence</Typography>
          <Stack spacing={1.5}>
            {latestEvidence.map((item) => (
              <Box key={item.id} sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 1.25 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{item.title}</Typography>
                  <Chip label={item.status} color={statusColor(item.status)} size="small" />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {item.control ? `${item.control.framework} ${item.control.reference}` : "General evidence"} - {formatDate(item.createdAt)}
                </Typography>
              </Box>
            ))}
            {!latestEvidence.length && <Alert severity="info">No evidence available for auditors yet.</Alert>}
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
