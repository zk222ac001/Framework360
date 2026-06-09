import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { getDashboard } from "../../api/dashboard";
import type { DashboardResponse, DashboardTopAction } from "../../types/dashboard";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function priorityColor(priority: string) {
  if (priority === "HIGH") return "error";
  if (priority === "MEDIUM") return "warning";
  return "primary";
}

function CopilotCard({ title, description, priority }: { title: string; description: string; priority: string }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 4, minWidth: 0 }}>
      <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{title}</Typography>
        <Chip label={priority} size="small" color={priorityColor(priority)} />
      </Stack>
      <Typography variant="body2" color="text.secondary">{description}</Typography>
    </Paper>
  );
}

function GapAnalysisPanel({ actions }: { actions: DashboardTopAction[] }) {
  const high = actions.filter((action) => action.priority === "HIGH");
  const missingEvidence = actions.filter((action) => !action.hasEvidence);

  return (
    <Paper sx={{ p: 3, borderRadius: 5, height: "100%" }}>
      <Typography variant="h6" gutterBottom>Gap analysis</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Copilot highlights the highest-impact reasons your program is not yet audit-ready.</Typography>
      <Stack spacing={1.5}>
        <CopilotCard title="High-priority gaps" description={`${high.length} high-priority controls need remediation before audit.`} priority={high.length ? "HIGH" : "LOW"} />
        <CopilotCard title="Missing evidence" description={`${missingEvidence.length} prioritized items are missing supporting evidence.`} priority={missingEvidence.length ? "HIGH" : "LOW"} />
        <CopilotCard title="Framework focus" description="Prioritize the lowest-scoring framework first to improve total readiness fastest." priority="MEDIUM" />
      </Stack>
    </Paper>
  );
}

function ControlRecommendations({ actions }: { actions: DashboardTopAction[] }) {
  return (
    <Paper sx={{ p: 3, borderRadius: 5, height: "100%" }}>
      <Typography variant="h6" gutterBottom>Control recommendations</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Recommended remediation actions based on current control gaps.</Typography>
      <Stack spacing={1.5}>
        {!actions.length && <Typography variant="body2" color="text.secondary">No recommendations yet.</Typography>}
        {actions.slice(0, 6).map((action) => (
          <Box key={`${action.assessmentId}-${action.requirementId}`} sx={{ p: 2, borderRadius: 3, bgcolor: "surface.level2", border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: "wrap" }}>
              <Chip label={action.priority} size="small" color={priorityColor(action.priority)} />
              <Typography variant="caption" color="text.secondary">{action.framework} - {action.section}</Typography>
            </Stack>
            <Typography variant="body2" sx={{ fontWeight: 900 }}>{action.title}</Typography>
            <Typography variant="caption" color="text.secondary">{action.action}</Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

function EvidenceSuggestions({ actions }: { actions: DashboardTopAction[] }) {
  const suggestions = actions
    .filter((action) => !action.hasEvidence)
    .slice(0, 6)
    .map((action) => ({
      key: `${action.assessmentId}-${action.requirementId}`,
      framework: action.framework,
      title: action.title,
      evidence: action.evidenceNeeded || "Policy, procedure, screenshot, system export, owner attestation, or vendor documentation",
      priority: action.priority,
    }));

  return (
    <Paper sx={{ p: 3, borderRadius: 5 }}>
      <Typography variant="h6" gutterBottom>Evidence suggestions</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Suggested artifacts to collect for missing-evidence controls.</Typography>
      <Stack spacing={1.5}>
        {!suggestions.length && <Typography variant="body2" color="text.secondary">No missing evidence suggestions right now.</Typography>}
        {suggestions.map((item) => (
          <Box key={item.key} sx={{ p: 2, borderRadius: 3, bgcolor: "surface.level2", border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 900 }}>{item.framework}</Typography>
              <Chip label={item.priority} size="small" color={priorityColor(item.priority)} />
            </Stack>
            <Typography variant="body2">{item.title}</Typography>
            <Typography variant="caption" color="text.secondary">Suggested evidence: {item.evidence}</Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

function AskCopilot({ dashboard }: { dashboard: DashboardResponse }) {
  const [question, setQuestion] = useState("What should I fix first?");
  const answer = useMemo(() => {
    const actions = dashboard.topActions || [];
    const high = actions.filter((action) => action.priority === "HIGH");
    const missingEvidence = actions.filter((action) => !action.hasEvidence);
    const weakest = [...dashboard.frameworks].sort((a, b) => (a.score || 0) - (b.score || 0))[0];

    if (question.toLowerCase().includes("evidence")) {
      return `${missingEvidence.length} prioritized controls are missing evidence. Start by collecting the evidence suggested for high-priority items first.`;
    }

    if (question.toLowerCase().includes("framework") || question.toLowerCase().includes("score")) {
      return weakest ? `${weakest.name} is currently the lowest-scoring framework at ${Math.round(weakest.score)}%. Focus there first for the fastest readiness gain.` : "Add frameworks to unlock score-based recommendations.";
    }

    if (question.toLowerCase().includes("vendor")) {
      const highVendors = (dashboard.vendorRisk?.matrix.critical || 0) + (dashboard.vendorRisk?.matrix.high || 0);
      return `${highVendors} vendors are currently critical or high risk. Review these vendors and attach due diligence evidence.`;
    }

    return high.length
      ? `Fix the ${high.length} high-priority remediation items first, then attach evidence and move them through approval review.`
      : "Your highest-impact next step is to close open evidence requests and review remaining framework gaps.";
  }, [dashboard, question]);

  return (
    <Paper sx={{ p: 3, borderRadius: 5, background: "linear-gradient(135deg, rgba(37,99,235,.12), rgba(20,184,166,.08))" }}>
      <Chip label="Ask Copilot" color="primary" sx={{ mb: 2 }} />
      <Typography variant="h6" gutterBottom>Compliance Q&A</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Ask practical questions about gaps, evidence, frameworks, or vendor risk. This first version is deterministic and grounded in dashboard data.</Typography>
      <TextField fullWidth label="Question" value={question} onChange={(event) => setQuestion(event.target.value)} sx={{ mb: 2 }} />
      <Paper sx={{ p: 2, borderRadius: 3, bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
        <Typography variant="body2">{answer}</Typography>
      </Paper>
    </Paper>
  );
}

export default function AiComplianceCopilotPage() {
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
    return <Alert severity="info">No copilot data available yet.</Alert>;
  }

  const actions = dashboard.topActions || [];

  return (
    <Box sx={{ width: "100%", maxWidth: 1180, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 2, md: 4 }, boxSizing: "border-box" }}>
      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 6, mb: 3, position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top left, rgba(37,99,235,.22), transparent 22rem), radial-gradient(circle at bottom right, rgba(20,184,166,.18), transparent 20rem)", pointerEvents: "none" }} />
        <Box sx={{ position: "relative" }}>
          <Chip label="AI Compliance Copilot" color="primary" sx={{ mb: 2 }} />
          <Typography variant="h3" gutterBottom>Explain gaps, suggest controls, and guide evidence collection.</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 780 }}>
            Copilot translates framework gaps into practical remediation, evidence suggestions and priority guidance using your current compliance data.
          </Typography>
        </Box>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" }, gap: 3, mb: 3 }}>
        <GapAnalysisPanel actions={actions} />
        <ControlRecommendations actions={actions} />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" }, gap: 3 }}>
        <EvidenceSuggestions actions={actions} />
        <AskCopilot dashboard={dashboard} />
      </Box>
    </Box>
  );
}
