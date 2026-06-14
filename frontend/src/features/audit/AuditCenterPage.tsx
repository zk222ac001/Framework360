import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { downloadExecutiveReport, getDashboard } from "../../api/dashboard";
import type { DashboardResponse, DashboardTopAction } from "../../types/dashboard";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function AuditMetric({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 4, flex: 1, minWidth: 220 }}>
      <Typography variant="h4">{value}</Typography>
      <Typography variant="subtitle2">{label}</Typography>
      <Typography variant="caption" color="text.secondary">{helper}</Typography>
    </Paper>
  );
}

function EvidenceRequestTracker({ actions }: { actions: DashboardTopAction[] }) {
  const missingEvidence = actions.filter((action) => !action.hasEvidence);

  return (
    <Paper sx={{ p: 3, borderRadius: 5 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2, justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h6">Evidence request tracker</Typography>
          <Typography variant="body2" color="text.secondary">Controls that need supporting documentation before audit review.</Typography>
        </Box>
        <Chip label={`${missingEvidence.length} open requests`} color={missingEvidence.length ? "warning" : "success"} />
      </Stack>
      <Stack spacing={1.5}>
        {!missingEvidence.length && <Typography variant="body2" color="text.secondary">No missing evidence requests right now.</Typography>}
        {missingEvidence.slice(0, 8).map((action) => (
          <Box key={`${action.assessmentId}-${action.requirementId}`} sx={{ p: 2, borderRadius: 3, bgcolor: "surface.level2", border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={1} sx={{ mb: 0.75, alignItems: "center" }}>
              <Chip label={action.priority} size="small" color={action.priority === "HIGH" ? "error" : action.priority === "MEDIUM" ? "warning" : "primary"} />
              <Typography variant="caption" color="text.secondary">{action.framework} - {action.section}</Typography>
            </Stack>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>{action.title}</Typography>
            <Typography variant="caption" color="text.secondary">Evidence needed: {action.evidenceNeeded || "Owner review and supporting documentation"}</Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

function AuditPackageGenerator({ dashboard }: { dashboard: DashboardResponse }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    try {
      setError(null);
      setIsDownloading(true);
      await downloadExecutiveReport();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 5, height: "100%", background: "linear-gradient(135deg, rgba(37,99,235,.12), rgba(20,184,166,.08))" }}>
      <Chip label="Audit package" color="primary" sx={{ mb: 2 }} />
      <Typography variant="h6" gutterBottom>Generate audit package</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Package executive readiness, framework scores, gaps, evidence metrics and vendor risk into one PDF.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography variant="body2" color="text.secondary">Frameworks</Typography><Typography variant="body2" sx={{ fontWeight: 800 }}>{dashboard.frameworks.length}</Typography></Stack>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography variant="body2" color="text.secondary">Evidence files</Typography><Typography variant="body2" sx={{ fontWeight: 800 }}>{dashboard.evidenceAnalytics?.totalEvidence || 0}</Typography></Stack>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography variant="body2" color="text.secondary">Open gaps</Typography><Typography variant="body2" sx={{ fontWeight: 800 }}>{dashboard.overall?.totalGaps || 0}</Typography></Stack>
      </Stack>
      <Button variant="contained" fullWidth onClick={handleDownload} disabled={isDownloading}>
        {isDownloading ? "Preparing package..." : "Download audit package"}
      </Button>
    </Paper>
  );
}

export default function AuditCenterPage() {
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

  if (isLoading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!dashboard) {
    return <Alert severity="info">No audit data available yet.</Alert>;
  }

  const readiness = dashboard.overall?.averageScore || 0;
  const missingEvidence = dashboard.topActions?.filter((action) => !action.hasEvidence).length || 0;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 6, mb: 3, position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top left, rgba(37,99,235,.20), transparent 22rem)", pointerEvents: "none" }} />
        <Box sx={{ position: "relative" }}>
          <Chip label="Audit Workspace" color="primary" sx={{ mb: 2 }} />
          <Typography variant="h3" gutterBottom>Audit center</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 760 }}>
            Prepare evidence, package reports and track audit readiness from one workspace.
          </Typography>
        </Box>
      </Paper>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} sx={{ mb: 3 }}>
        <AuditMetric label="Audit readiness" value={`${readiness}%`} helper="Average readiness across active frameworks." />
        <AuditMetric label="Missing evidence" value={missingEvidence} helper="Priority controls still missing documentation." />
        <AuditMetric label="Open gaps" value={dashboard.overall?.totalGaps || 0} helper="Controls requiring remediation or review." />
        <AuditMetric label="Evidence files" value={dashboard.evidenceAnalytics?.totalEvidence || 0} helper="Uploaded files linked to controls." />
      </Stack>

      <Paper sx={{ p: 3, borderRadius: 5, mb: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ alignItems: { xs: "stretch", md: "center" } }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>Audit readiness progress</Typography>
            <Typography variant="body2" color="text.secondary">Use this snapshot to decide whether the organization is ready for an external review.</Typography>
          </Box>
          <Box sx={{ flex: 2 }}>
            <LinearProgress variant="determinate" value={readiness} sx={{ height: 14, borderRadius: 999 }} />
          </Box>
        </Stack>
      </Paper>

      <Stack direction={{ xs: "column", xl: "row" }} spacing={3}>
        <Box sx={{ flex: 1.2 }}><EvidenceRequestTracker actions={dashboard.topActions || []} /></Box>
        <Box sx={{ flex: 0.8 }}><AuditPackageGenerator dashboard={dashboard} /></Box>
      </Stack>
    </Box>
  );
}
