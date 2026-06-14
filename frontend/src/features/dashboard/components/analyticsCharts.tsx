import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { DashboardInteractiveAnalytics } from "../../../types/dashboard";

type SeriesPoint = { label: string; value: number };

function getMaxValue(points: SeriesPoint[]) {
  return Math.max(1, ...points.map((point) => point.value || 0));
}

function EmptyState({ label }: { label: string }) {
  return (
    <Box sx={{ p: 3, borderRadius: 3, bgcolor: "surface.level2", textAlign: "center" }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
    </Box>
  );
}

function BarSeries({ points, suffix = "" }: { points: SeriesPoint[]; suffix?: string }) {
  const max = getMaxValue(points);

  if (!points.length) {
    return <EmptyState label="No chart data yet." />;
  }

  return (
    <Stack spacing={1.4}>
      {points.map((point) => {
        const value = Math.max(0, Math.round(point.value || 0));
        const width = Math.max(4, Math.round((value / max) * 100));
        return (
          <Box key={point.label}>
            <Stack direction="row" sx={{ mb: 0.6, justifyContent: "space-between" }}>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>{point.label}</Typography>
              <Typography variant="body2" color="text.secondary">{value}{suffix}</Typography>
            </Stack>
            <Box sx={{ height: 11, borderRadius: 999, bgcolor: "surface.level2", overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
              <Box sx={{ width: `${width}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #2563eb, #14b8a6)" }} />
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}

function MiniTrend({ points }: { points: SeriesPoint[] }) {
  if (!points.length) {
    return <EmptyState label="No trend data yet." />;
  }

  const max = getMaxValue(points);
  return (
    <Stack direction="row" spacing={1} sx={{ height: 150, mt: 2, alignItems: "flex-end" }}>
      {points.map((point) => {
        const height = Math.max(10, Math.round(((point.value || 0) / max) * 130));
        return (
          <Stack key={point.label} spacing={1} sx={{ flex: 1, alignItems: "center" }}>
            <Typography variant="caption" color="text.secondary">{Math.round(point.value)}%</Typography>
            <Box sx={{ width: "100%", maxWidth: 42, height, borderRadius: "12px 12px 4px 4px", background: "linear-gradient(180deg, #14b8a6, #2563eb)" }} />
            <Typography variant="caption" color="text.secondary">{point.label}</Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}

export function ReadinessTrendChart({ data }: { data?: DashboardInteractiveAnalytics }) {
  return (
    <Paper sx={{ p: 3, borderRadius: 5, height: "100%" }}>
      <Stack direction="row" sx={{ mb: 1, justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">Readiness trend</Typography>
        <Chip label="6 months" size="small" color="primary" />
      </Stack>
      <Typography variant="body2" color="text.secondary">Month-by-month readiness trend derived from current assessment maturity.</Typography>
      <MiniTrend points={data?.readinessTrend || []} />
    </Paper>
  );
}

export function EvidenceGrowthChart({ data }: { data?: DashboardInteractiveAnalytics }) {
  return (
    <Paper sx={{ p: 3, borderRadius: 5, height: "100%" }}>
      <Typography variant="h6" gutterBottom>Evidence growth</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Evidence uploads grouped by month.</Typography>
      <BarSeries points={data?.evidenceGrowth || []} />
    </Paper>
  );
}

export function VendorRiskChart({ data }: { data?: DashboardInteractiveAnalytics }) {
  return (
    <Paper sx={{ p: 3, borderRadius: 5, height: "100%" }}>
      <Typography variant="h6" gutterBottom>Vendor risk distribution</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Suppliers grouped by risk severity.</Typography>
      <BarSeries points={data?.vendorRiskChart || []} />
    </Paper>
  );
}

export function FrameworkPerformanceChart({ data }: { data?: DashboardInteractiveAnalytics }) {
  const rows = data?.frameworkPerformance || [];

  return (
    <Paper sx={{ p: 3, borderRadius: 5 }}>
      <Typography variant="h6" gutterBottom>Framework performance</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Score, progress, and gap pressure by framework.</Typography>
      <Stack spacing={1.5}>
        {!rows.length && <EmptyState label="No framework performance data yet." />}
        {rows.slice(0, 8).map((framework) => (
          <Box key={framework.label} sx={{ p: 2, borderRadius: 3, bgcolor: "surface.level2", border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={2} sx={{ mb: 1, justifyContent: "space-between" }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>{framework.name}</Typography>
                <Typography variant="caption" color="text.secondary">{framework.gaps} open gaps</Typography>
              </Box>
              <Chip label={`${framework.score}%`} size="small" color={framework.score >= 80 ? "success" : framework.score >= 50 ? "warning" : "error"} />
            </Stack>
            <LinearProgress variant="determinate" value={Math.max(0, Math.min(100, framework.progress || framework.score || 0))} sx={{ height: 9, borderRadius: 999 }} />
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

export function InteractiveAnalyticsSection({ data }: { data?: DashboardInteractiveAnalytics }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction={{ xs: "column", xl: "row" }} spacing={3} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}><ReadinessTrendChart data={data} /></Box>
        <Box sx={{ flex: 1 }}><EvidenceGrowthChart data={data} /></Box>
      </Stack>
      <Stack direction={{ xs: "column", xl: "row" }} spacing={3}>
        <Box sx={{ flex: 1 }}><VendorRiskChart data={data} /></Box>
        <Box sx={{ flex: 1.2 }}><FrameworkPerformanceChart data={data} /></Box>
      </Stack>
    </Box>
  );
}
