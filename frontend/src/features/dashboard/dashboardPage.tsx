import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getDashboard } from "../../api/dashboard";
import type { DashboardResponse } from "../../types/dashboard";
import { InteractiveAnalyticsSection } from "./components/analyticsCharts";
import { useTranslation } from "react-i18next";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function clampScore(score?: number) {
  return Math.max(0, Math.min(100, Math.round(score || 0)));
}

function averageScore(values: number[]) {
  if (!values.length) return 0;
  return clampScore(values.reduce((sum, value) => sum + clampScore(value), 0) / values.length);
}

function ScoreCard({ title, score, helper }: { title: string; score: number; helper: string }) {
  return (
    <Paper sx={{ p: 3, borderRadius: 5, minWidth: 0, height: "100%" }}>
      <Typography variant="overline" color="text.secondary">{title}</Typography>
      <Typography variant="h3" sx={{ mt: 1 }}>{score}%</Typography>
      <LinearProgress variant="determinate" value={score} sx={{ height: 10, borderRadius: 999, my: 2 }} />
      <Typography variant="body2" color="text.secondary">{helper}</Typography>
    </Paper>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 4, minWidth: 0 }}>
      <Typography variant="h5">{value}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 800 }}>{label}</Typography>
      <Typography variant="caption" color="text.secondary">{helper}</Typography>
    </Paper>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const frameworks = dashboard?.frameworks || [];
  const average = dashboard?.overall?.averageScore ?? averageScore(frameworks.map((framework) => framework.score));
  const lawScore = dashboard?.lawScore ?? 0;
  const certificateScore = dashboard?.certificateScore ?? 0;
  const totalGaps = dashboard?.overall?.totalGaps ?? frameworks.reduce((sum, framework) => sum + (framework.gapsCount || 0), 0);
  const completed = dashboard?.overall?.completedFrameworks ?? frameworks.filter((framework) => framework.status === "COMPLETED").length;

  if (isLoading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box" }}>
      <Box sx={{ width: "100%", maxWidth: 1180, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 2, md: 4 }, boxSizing: "border-box" }}>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Paper sx={{ p: { xs: 3, md: 5 }, mb: 4, borderRadius: 6, position: "relative", overflow: "hidden" }}>
          <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top left, rgba(37,99,235,.22), transparent 22rem), radial-gradient(circle at bottom right, rgba(20,184,166,.18), transparent 20rem)", pointerEvents: "none" }} />
          <Stack direction={{ xs: "column", lg: "row" }} spacing={3} sx={{ position: "relative", minWidth: 0, alignItems: { xs: "stretch", lg: "center" }, justifyContent: "space-between" }}>
            <Box sx={{ minWidth: 0, maxWidth: 720 }}>
              <Chip label="Framework360 Command Center" color="primary" sx={{ mb: 2 }} />
              <Typography variant="h3" sx={{ fontSize: { xs: 38, md: 56 }, lineHeight: 1.04, mb: 2 }}>
                Your compliance overview, simplified.
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Track frameworks, evidence, vendors, dependencies, activity, and AI-guided remediation across your organization.
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ flexShrink: 0 }}>
              <Button variant="outlined" onClick={() => navigate("/evidence")}>Evidence</Button>
              <Button variant="contained" onClick={() => navigate("/frameworks/add")}>+ {t("dashboard.addFramework")}</Button>
            </Stack>
          </Stack>
        </Paper>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" }, gap: 2.5, mb: 3 }}>
          <ScoreCard title="EU law compliance score" score={lawScore} helper="Average readiness across regulatory frameworks." />
          <ScoreCard title="Voluntary certificate score" score={certificateScore} helper="Average readiness across certification frameworks." />
          <ScoreCard title="Overall readiness" score={average} helper={`${completed} completed frameworks out of ${frameworks.length}.`} />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 2, mb: 4 }}>
          <MetricCard label="Active frameworks" value={frameworks.length} helper="Frameworks tracked in your workspace." />
          <MetricCard label="Open gaps" value={totalGaps} helper="Controls needing action or evidence." />
          <MetricCard label="Evidence files" value={dashboard?.evidenceAnalytics?.totalEvidence || 0} helper="Uploaded evidence files." />
          <MetricCard label="Vendors" value={dashboard?.vendorRisk?.totalVendors || 0} helper="Registered third-party vendors." />
        </Box>

        <InteractiveAnalyticsSection data={dashboard?.interactiveAnalytics} />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2.5, mb: 4 }}>
          <Paper sx={{ p: 3, borderRadius: 5, minWidth: 0 }}>
            <Typography variant="h6" gutterBottom>Framework performance</Typography>
            <Stack spacing={1.5}>
              {frameworks.slice(0, 8).map((framework) => {
                const score = clampScore(framework.score);
                return (
                  <Box key={framework.code}>
                    <Stack direction="row" sx={{ mb: 0.75, minWidth: 0, justifyContent: "space-between" }}>
                      <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>{framework.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{score}%</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={score} sx={{ height: 9, borderRadius: 999 }} />
                  </Box>
                );
              })}
              {!frameworks.length && <Typography variant="body2" color="text.secondary">No frameworks added yet.</Typography>}
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 5, minWidth: 0 }}>
            <Typography variant="h6" gutterBottom>AI compliance assistant</Typography>
            <Stack spacing={1.5}>
              {(dashboard?.aiRecommendations || []).slice(0, 5).map((item) => (
                <Box key={item.title} sx={{ p: 2, borderRadius: 3, bgcolor: "surface.level2", minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between" }}>
                    <Typography variant="subtitle2">{item.title}</Typography>
                    <Chip label={item.priority} size="small" color={item.priority === "HIGH" ? "error" : item.priority === "MEDIUM" ? "warning" : "primary"} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{item.description}</Typography>
                </Box>
              ))}
              {!dashboard?.aiRecommendations?.length && <Typography variant="body2" color="text.secondary">No recommendations yet.</Typography>}
            </Stack>
          </Paper>
        </Box>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2.5, justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5">{t("dashboard.frameworks")}</Typography>
            <Typography variant="body2" color="text.secondary">Continue assessments, review readiness, or add another compliance framework.</Typography>
          </Box>
          <Button variant="contained" onClick={() => navigate("/frameworks/add")}>+ {t("dashboard.addFramework")}</Button>
        </Stack>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }, gap: 2.5 }}>
          {frameworks.map((framework) => {
            const score = clampScore(framework.score);
            return (
              <Paper key={framework.code} onClick={() => navigate(`/frameworks/${framework.code}`)} sx={{ p: 3, borderRadius: 5, cursor: "pointer", minWidth: 0 }}>
                <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" noWrap>{framework.name}</Typography>
                    {framework.category && <Typography variant="body2" color="text.secondary">{framework.category}</Typography>}
                  </Box>
                  <Chip label={framework.status === "COMPLETED" ? "Completed" : "In progress"} color={framework.status === "COMPLETED" ? "success" : "primary"} size="small" />
                </Stack>
                <Typography variant="h4" sx={{ mt: 3 }}>{score}%</Typography>
                <LinearProgress variant="determinate" value={score} sx={{ height: 10, borderRadius: 999, my: 2 }} />
                <Button variant="outlined" onClick={(event) => { event.stopPropagation(); navigate(`/frameworks/${framework.code}`); }}>
                  Continue →
                </Button>
              </Paper>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
