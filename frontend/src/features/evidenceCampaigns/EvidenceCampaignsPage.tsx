import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getEvidenceCampaigns, sendEvidenceCampaignReminder } from "../../api/evidenceCampaigns";
import type { EvidenceCampaign, EvidenceCampaignRequest, EvidenceRequestPriority, EvidenceRequestStatus } from "../../types/evidenceCampaigns";

function priorityColor(priority: EvidenceRequestPriority) {
  if (priority === "HIGH") return "error";
  if (priority === "MEDIUM") return "warning";
  return "primary";
}

function statusColor(status: EvidenceRequestStatus) {
  return status === "COLLECTED" ? "success" : "primary";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function CampaignMetric({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 4 }}>
      <Typography variant="h4">{value}</Typography>
      <Typography variant="subtitle2">{label}</Typography>
      <Typography variant="caption" color="text.secondary">{helper}</Typography>
    </Paper>
  );
}

function RequestCard({ request, onRemind }: { request: EvidenceCampaignRequest; onRemind: (requestId: string) => void }) {
  const isOverdue = request.status !== "COLLECTED" && new Date(request.dueDate) < new Date();

  return (
    <Paper sx={{ p: 2.5, borderRadius: 4, minWidth: 0 }}>
      <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mb: 1 }}>
            <Chip label={request.priority} size="small" color={priorityColor(request.priority)} />
            <Chip label={request.status} size="small" color={statusColor(request.status)} />
            {isOverdue && <Chip label="OVERDUE" size="small" color="error" />}
            <Chip label={request.framework} size="small" variant="outlined" />
          </Stack>
          <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{request.title}</Typography>
          <Typography variant="body2" color="text.secondary">Section: {request.section}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Owner: {request.owner}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Due: {formatDate(request.dueDate)}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>Suggested evidence: {request.suggestedEvidence}</Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <Button variant="outlined" size="small" onClick={() => onRemind(request.id)} disabled={request.status === "COLLECTED"}>Send reminder</Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function CampaignPanel({ campaign, onRemind }: { campaign: EvidenceCampaign; onRemind: (requestId: string) => void }) {
  const completion = campaign.summary.total ? Math.round((campaign.summary.collected / campaign.summary.total) * 100) : 100;

  return (
    <Stack spacing={2.5}>
      <Paper sx={{ p: 3, borderRadius: 5 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2, justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6">{campaign.name}</Typography>
            <Typography variant="body2" color="text.secondary">{campaign.description}</Typography>
          </Box>
          <Chip label={campaign.status} color={campaign.status === "COMPLETE" ? "success" : "primary"} />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Campaign completion</Typography>
        <LinearProgress variant="determinate" value={completion} sx={{ height: 12, borderRadius: 999, mb: 1 }} />
        <Typography variant="caption" color="text.secondary">{completion}% complete · Due {formatDate(campaign.dueDate)}</Typography>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(5, minmax(0, 1fr))" }, gap: 2 }}>
        <CampaignMetric label="Total" value={campaign.summary.total} helper="Evidence requests" />
        <CampaignMetric label="Requested" value={campaign.summary.requested} helper="Waiting for owner" />
        <CampaignMetric label="Collected" value={campaign.summary.collected} helper="Evidence uploaded" />
        <CampaignMetric label="Overdue" value={campaign.summary.overdue} helper="Past due date" />
        <CampaignMetric label="High" value={campaign.summary.high} helper="High priority" />
      </Box>

      <Stack spacing={2}>
        {!campaign.requests.length && <Paper sx={{ p: 3, borderRadius: 5 }}><Typography color="text.secondary">No evidence requests in this campaign.</Typography></Paper>}
        {campaign.requests.map((request) => <RequestCard key={request.id} request={request} onRemind={onRemind} />)}
      </Stack>
    </Stack>
  );
}

export default function EvidenceCampaignsPage() {
  const [campaigns, setCampaigns] = useState<EvidenceCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    getEvidenceCampaigns()
      .then((data) => setCampaigns(data.campaigns))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load evidence campaigns"))
      .finally(() => setIsLoading(false));
  }, []);

  const activeCampaign = useMemo(() => campaigns[0], [campaigns]);

  async function handleRemind(requestId: string) {
    setError(null);
    setNotice(null);
    try {
      await sendEvidenceCampaignReminder(requestId);
      setNotice("Reminder recorded in audit log.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reminder");
    }
  }

  if (isLoading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 1180, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 2, md: 4 }, boxSizing: "border-box" }}>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 3 }}>{notice}</Alert>}

      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 6, mb: 3, position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top left, rgba(20,184,166,.22), transparent 22rem), radial-gradient(circle at bottom right, rgba(37,99,235,.16), transparent 20rem)", pointerEvents: "none" }} />
        <Box sx={{ position: "relative" }}>
          <Chip label="Evidence operations" color="primary" sx={{ mb: 2 }} />
          <Typography variant="h3" gutterBottom>Evidence Campaigns</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 760 }}>Coordinate evidence collection across control owners, track completion, and record reminder activity for audit readiness.</Typography>
        </Box>
      </Paper>

      {activeCampaign ? <CampaignPanel campaign={activeCampaign} onRemind={handleRemind} /> : <Alert severity="info">No evidence campaigns available yet.</Alert>}
    </Box>
  );
}
