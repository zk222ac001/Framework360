import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  createEvidenceJob,
  deleteEvidenceJob,
  getEvidenceJobs,
  runEvidenceJob,
  updateEvidenceJob,
  type EvidenceCollectionJob,
} from "../../api/evidenceAutomation";
import { getIntegrations, type IntegrationProvider } from "../../api/integrations";

type Schedule = "MANUAL" | "DAILY" | "WEEKLY" | "MONTHLY";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function statusColor(status?: string): "success" | "warning" | "error" | "default" {
  if (status === "SUCCESS" || status === "ACTIVE") return "success";
  if (status === "FAILED") return "error";
  if (status === "PAUSED") return "warning";
  return "default";
}

export default function EvidenceAutomationPage() {
  const [jobs, setJobs] = useState<EvidenceCollectionJob[]>([]);
  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [form, setForm] = useState({ name: "", provider: "MICROSOFT365", schedule: "MANUAL" as Schedule });
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [jobData, integrationData] = await Promise.all([
        getEvidenceJobs(),
        getIntegrations(),
      ]);
      setJobs(jobData.jobs);
      setProviders(integrationData.providers);
      setForm((current) =>
        current.provider || !integrationData.providers[0]
          ? current
          : { ...current, provider: integrationData.providers[0].id }
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleCreate() {
    if (!form.name.trim()) return;

    setBusyId("new");
    setError(null);
    setNotice(null);
    try {
      await createEvidenceJob({
        name: form.name.trim(),
        provider: form.provider,
        schedule: form.schedule,
        status: "ACTIVE",
      });
      setForm((current) => ({ ...current, name: "" }));
      setNotice("Evidence collection job created.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRun(job: EvidenceCollectionJob) {
    setBusyId(job.id);
    setError(null);
    setNotice(null);
    try {
      const response = await runEvidenceJob(job.id);
      setNotice(response.run.message || `Created ${response.run.createdEvidenceCount} evidence item(s).`);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggle(job: EvidenceCollectionJob) {
    setBusyId(job.id);
    setError(null);
    try {
      await updateEvidenceJob(job.id, {
        status: job.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
      });
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(job: EvidenceCollectionJob) {
    if (!window.confirm(`Delete ${job.name}?`)) return;

    setBusyId(job.id);
    setError(null);
    try {
      await deleteEvidenceJob(job.id);
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
    <Box sx={{ width: "100%", maxWidth: 1180, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 2, md: 4 } }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Chip label="Automated evidence collection" color="primary" sx={{ alignSelf: "flex-start" }} />
        <Typography variant="h4">Evidence collection jobs</Typography>
        <Typography color="text.secondary">
          Schedule provider snapshots and create evidence records for controls, assets, vendor posture, and remediation workflow.
        </Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}

      <Paper sx={{ p: 3, borderRadius: 5, mb: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField label="Job name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} fullWidth />
          <TextField select label="Provider" value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value })} sx={{ minWidth: 220 }}>
            {providers.map((provider) => (
              <MenuItem key={provider.id} value={provider.id}>{provider.name}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Schedule" value={form.schedule} onChange={(event) => setForm({ ...form, schedule: event.target.value as Schedule })} sx={{ minWidth: 180 }}>
            {["MANUAL", "DAILY", "WEEKLY", "MONTHLY"].map((schedule) => (
              <MenuItem key={schedule} value={schedule}>{schedule}</MenuItem>
            ))}
          </TextField>
          <Button variant="contained" disabled={!form.name.trim() || busyId === "new"} onClick={handleCreate}>
            Create
          </Button>
        </Stack>
      </Paper>

      <Stack spacing={2}>
        {jobs.map((job) => (
          <Paper key={job.id} sx={{ p: 3, borderRadius: 5 }}>
            <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                  <Typography variant="h6">{job.name}</Typography>
                  <Chip label={job.status} color={statusColor(job.status)} size="small" />
                  {job.lastRunStatus && <Chip label={`Last: ${job.lastRunStatus}`} color={statusColor(job.lastRunStatus)} size="small" variant="outlined" />}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {job.providerName} - {job.schedule} - {job.connection ? `${job.connection.displayName} (${job.connection.status})` : "No connection registered"}
                </Typography>
                {job.runs[0]?.message && <Typography variant="caption" color="text.secondary">{job.runs[0].message}</Typography>}
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button variant="contained" disabled={busyId === job.id || job.status !== "ACTIVE"} onClick={() => handleRun(job)}>Run now</Button>
                <Button variant="outlined" disabled={busyId === job.id} onClick={() => handleToggle(job)}>
                  {job.status === "ACTIVE" ? "Pause" : "Activate"}
                </Button>
                <Button color="error" variant="outlined" disabled={busyId === job.id} onClick={() => handleDelete(job)}>Delete</Button>
              </Stack>
            </Stack>
          </Paper>
        ))}
        {!jobs.length && <Alert severity="info">No evidence collection jobs yet.</Alert>}
      </Stack>
    </Box>
  );
}
