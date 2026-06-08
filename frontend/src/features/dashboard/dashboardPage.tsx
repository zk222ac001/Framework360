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
import { useTranslation } from "react-i18next";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score || 0)));
}

function isEuLawFramework(category?: string | null) {
  return category?.trim().toLowerCase() === "eu law";
}

function averageScore(scores: number[]) {
  if (scores.length === 0) return 0;
  const total = scores.reduce((sum, score) => sum + clampScore(score), 0);
  return clampScore(total / scores.length);
}

function getScoreLabel(score: number) {
  if (score >= 85) return "Strong";
  if (score >= 60) return "Improving";
  if (score > 0) return "Needs focus";
  return "Not started";
}

type ScoreCardProps = {
  title: string;
  description: string;
  score: number;
  icon: string;
};

function ScoreCard({ title, description, score, icon }: ScoreCardProps) {
  return (
    <Paper sx={{ flex: 1, minWidth: 280, p: 3, borderRadius: 5, position: "relative", overflow: "hidden" }}>
      <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(37, 99, 235, 0.14), transparent 45%), radial-gradient(circle at top right, rgba(20, 184, 166, 0.16), transparent 12rem)", pointerEvents: "none" }} />
      <Box sx={{ position: "relative" }}>
        <Stack direction="row" justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="overline" color="text.secondary">{title}</Typography>
            <Typography variant="h3" sx={{ mt: 1, mb: 0.5 }}>{score}%</Typography>
            <Chip label={getScoreLabel(score)} size="small" color="primary" />
          </Box>
          <Box sx={{ width: 52, height: 52, borderRadius: 4, display: "grid", placeItems: "center", color: "primary.contrastText", background: "linear-gradient(135deg, #2563eb, #14b8a6)", fontSize: 26 }}>{icon}</Box>
        </Stack>
        <LinearProgress variant="determinate" value={score} sx={{ height: 12, borderRadius: 999, my: 2.5 }} />
        <Typography variant="body2" color="text.secondary">{description}</Typography>
      </Box>
    </Paper>
  );
}

type MetricCardProps = { label: string; value: string | number; helper: string; icon: string };

function MetricCard({ label, value, helper, icon }: MetricCardProps) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 4, minWidth: 220, flex: 1 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ width: 44, height: 44, borderRadius: 3, display: "grid", placeItems: "center", bgcolor: "surface.level2", color: "primary.main", fontSize: 22 }}>{icon}</Box>
        <Box>
          <Typography variant="h5">{value}</Typography>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
        </Box>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>{helper}</Typography>
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
      .then((data) => {
        if (isMounted) setDashboard(data);
      })
      .catch((err) => {
        if (isMounted) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [t]);

  const euLawFrameworks = dashboard?.frameworks.filter((framework) => isEuLawFramework(framework.category)) || [];
  const voluntaryFrameworks = dashboard?.frameworks.filter((framework) => !isEuLawFramework(framework.category)) || [];
  const frameworks = dashboard?.frameworks || [];
  const completedFrameworks = frameworks.filter((framework) => framework.status === "COMPLETED" && clampScore(framework.score) === 100);
  const averageOverallScore = averageScore(frameworks.map((framework) => framework.score));
  const lawScore = averageScore(euLawFrameworks.map((framework) => framework.score));
  const certificateScore = averageScore(voluntaryFrameworks.map((framework) => framework.score));

  if (isLoading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", p: { xs: 2, md: 4 } }}>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      <Paper sx={{ p: { xs: 3, md: 4 }, mb: 4, borderRadius: 6, position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top left, rgba(37, 99, 235, 0.22), transparent 22rem), radial-gradient(circle at bottom right, rgba(20, 184, 166, 0.2), transparent 20rem)", pointerEvents: "none" }} />
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={3} sx={{ position: "relative" }}>
          <Box sx={{ maxWidth: 760 }}>
            <Chip label="Framework360 Command Center" color="primary" sx={{ mb: 2 }} />
            <Typography variant="h3" sx={{ mb: 1 }}>Your compliance overview, simplified.</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680 }}>Track active frameworks, monitor readiness, and keep evidence-driven progress visible across your organization.</Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button variant="soft" onClick={() => navigate("/evidence")}>Evidence</Button>
            <Button variant="contained" onClick={() => navigate("/frameworks/add")}>+ {t("dashboard.addFramework")}</Button>
          </Stack>
        </Stack>
      </Paper>
      <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ mb: 3 }}>
        <ScoreCard title={t("dashboard.euLawScore")} description={t("dashboard.euLawScoreDescription")} score={lawScore} icon="SH" />
        <ScoreCard title={t("dashboard.certificateScore")} description={t("dashboard.certificateScoreDescription")} score={certificateScore} icon="OK" />
      </Stack>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} sx={{ mb: 4 }}>
        <MetricCard label="Active frameworks" value={frameworks.length} helper="Frameworks currently tracked in your workspace." icon="FW" />
        <MetricCard label="Completed" value={completedFrameworks.length} helper="Frameworks with a complete assessment score." icon="OK" />
        <MetricCard label="Average readiness" value={`${averageOverallScore}%`} helper="Average maturity across all selected frameworks." icon="UP" />
      </Stack>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2} sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant="h5">{t("dashboard.frameworks")}</Typography>
          <Typography variant="body2" color="text.secondary">Continue assessments, review readiness, or add another compliance framework.</Typography>
        </Box>
        <Button variant="contained" onClick={() => navigate("/frameworks/add")}>+ {t("dashboard.addFramework")}</Button>
      </Stack>
      {!dashboard || dashboard.frameworks.length === 0 ? (
        <Paper sx={{ p: { xs: 4, md: 6 }, borderRadius: 6, borderStyle: "dashed", textAlign: "center" }}>
          <Box sx={{ width: 72, height: 72, mx: "auto", mb: 2, borderRadius: 5, display: "grid", placeItems: "center", background: "linear-gradient(135deg, #2563eb, #14b8a6)", color: "primary.contrastText", fontSize: 34 }}>+</Box>
          <Typography variant="h5" gutterBottom>{t("dashboard.noFrameworks")}</Typography>
          <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 520, mx: "auto" }}>{t("dashboard.noFrameworksDescription")}</Typography>
          <Button variant="contained" size="large" onClick={() => navigate("/frameworks/add")}>{t("dashboard.addFirstFramework")}</Button>
        </Paper>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }, gap: 2.5 }}>
          {dashboard.frameworks.map((framework) => {
            const score = clampScore(framework.score);
            const isCompleted = framework.status === "COMPLETED" && score === 100;
            return (
              <Paper key={framework.code} onClick={() => navigate(`/frameworks/${framework.code}`)} sx={{ p: 3, borderRadius: 5, cursor: "pointer", minHeight: 230, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                    <Box>
                      <Typography variant="h6" gutterBottom>{framework.name}</Typography>
                      {framework.category && <Typography variant="body2" color="text.secondary">{framework.category}</Typography>}
                    </Box>
                    <Chip label={isCompleted ? t("dashboard.completed") : t("dashboard.inProgress")} color={isCompleted ? "success" : "primary"} size="small" />
                  </Stack>
                  <Stack direction="row" alignItems="flex-end" justifyContent="space-between" sx={{ mt: 3, mb: 1 }}>
                    <Typography variant="h4">{score}%</Typography>
                    <Typography variant="caption" color="text.secondary">readiness</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={score} sx={{ height: 10, borderRadius: 999 }} />
                </Box>
                <Button variant="outlined" onClick={(event) => { event.stopPropagation(); navigate(`/frameworks/${framework.code}`); }} sx={{ alignSelf: "flex-start", mt: 3 }}>
                  {isCompleted ? t("dashboard.view") : t("dashboard.continue")} →
                </Button>
              </Paper>
            );
          })}
          <Paper onClick={() => navigate("/frameworks/add")} sx={{ p: 3, borderRadius: 5, minHeight: 230, display: "grid", placeItems: "center", borderStyle: "dashed", cursor: "pointer", textAlign: "center" }}>
            <Box>
              <Typography variant="h3" color="primary">+</Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>{t("dashboard.addNewFramework")}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Expand your compliance coverage.</Typography>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
