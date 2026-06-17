import { useEffect, useState } from "react";
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
import { createAuditFinding, getAuditFindings, updateAuditFinding } from "../../api/auditFindings";
import type { AuditFinding, AuditFindingPriority, AuditFindingStatus, AuditFindingsSummary } from "../../types/auditFindings";

function priorityColor(priority: AuditFindingPriority) {
  if (priority === "HIGH") return "error";
  if (priority === "MEDIUM") return "warning";
  return "primary";
}

function statusColor(status: AuditFindingStatus) {
  if (status === "DONE") return "success";
  if (status === "IN_PROGRESS") return "warning";
  return "primary";
}

function Metric({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 4 }}>
      <Typography variant="h4">{value}</Typography>
      <Typography variant="subtitle2">{label}</Typography>
      <Typography variant="caption" color="text.secondary">{helper}</Typography>
    </Paper>
  );
}

function FindingCard({ finding, onStatus }: { finding: AuditFinding; onStatus: (id: string, status: AuditFindingStatus) => void }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 4, minWidth: 0 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
            <Chip label={finding.priority} size="small" color={priorityColor(finding.priority)} />
            <Chip label={finding.status.replace("_", " ")} size="small" color={statusColor(finding.status)} />
            {finding.framework && <Chip label={finding.framework} size="small" variant="outlined" />}
          </Stack>
          <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{finding.title}</Typography>
          {finding.description && <Typography variant="body2" color="text.secondary">{finding.description}</Typography>}
          {finding.requirement && <Typography variant="caption" color="text.secondary">Requirement: {finding.requirement}</Typography>}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Owner: {finding.owner}</Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <Button size="small" variant="outlined" onClick={() => onStatus(finding.id, "IN_PROGRESS")}>Start</Button>
          <Button size="small" variant="contained" onClick={() => onStatus(finding.id, "DONE")}>Close</Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function AuditFindingsPage() {
  const [summary, setSummary] = useState<AuditFindingsSummary | null>(null);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<AuditFindingPriority>("MEDIUM");

  async function load() {
    const data = await getAuditFindings();
    setSummary(data.summary);
    setFindings(data.findings);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Could not load findings")).finally(() => setIsLoading(false));
  }, []);

  async function handleCreate() {
    if (!title.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      await createAuditFinding({ title, description, priority });
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create finding");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatus(id: string, status: AuditFindingStatus) {
    setError(null);
    try {
      await updateAuditFinding(id, { status });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update finding");
    }
  }

  if (isLoading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 1180, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 2, md: 4 }, boxSizing: "border-box" }}>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 6, mb: 3, position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top left, rgba(37,99,235,.20), transparent 22rem)", pointerEvents: "none" }} />
        <Box sx={{ position: "relative" }}>
          <Chip label="Audit operations" color="primary" sx={{ mb: 2 }} />
          <Typography variant="h3" gutterBottom>Audit Findings Register</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 760 }}>Track findings, remediation ownership, status and closure evidence across your audit lifecycle.</Typography>
        </Box>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(5, minmax(0, 1fr))" }, gap: 2, mb: 3 }}>
        <Metric label="Total" value={summary?.total || 0} helper="All findings" />
        <Metric label="Open" value={summary?.open || 0} helper="New findings" />
        <Metric label="In progress" value={summary?.inProgress || 0} helper="Being remediated" />
        <Metric label="Closed" value={summary?.done || 0} helper="Completed" />
        <Metric label="High" value={summary?.high || 0} helper="High priority" />
      </Box>

      <Paper sx={{ p: 3, borderRadius: 5, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Create finding</Typography>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ alignItems: { xs: "stretch", lg: "flex-start" } }}>
          <TextField label="Finding title" value={title} onChange={(event) => setTitle(event.target.value)} fullWidth />
          <TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} fullWidth />
          <TextField select label="Priority" value={priority} onChange={(event) => setPriority(event.target.value as AuditFindingPriority)} sx={{ minWidth: 160 }}>
            <MenuItem value="LOW">Low</MenuItem>
            <MenuItem value="MEDIUM">Medium</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
          </TextField>
          <Button variant="contained" disabled={isSaving || !title.trim()} onClick={handleCreate} sx={{ minHeight: 56 }}>Create</Button>
        </Stack>
      </Paper>

      <Stack spacing={2}>
        {!findings.length && <Paper sx={{ p: 3, borderRadius: 5 }}><Typography color="text.secondary">No audit findings yet.</Typography></Paper>}
        {findings.map((finding) => <FindingCard key={finding.id} finding={finding} onStatus={handleStatus} />)}
      </Stack>
    </Box>
  );
}
