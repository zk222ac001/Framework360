import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { generatePolicy, getCopilotOverview } from "../../api/copilot";
import type {
  CopilotControlMapping,
  CopilotGap,
  CopilotOverview,
  CopilotPolicyAudience,
  GeneratedPolicy,
} from "../../types/copilot";

type ChipColor = "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";

const implementedLabels: Array<[keyof CopilotOverview["implemented"], string]> = [
  ["aiPoweredAssistant", "AI assistant"],
  ["automaticControlMapping", "Control mapping"],
  ["securityGapAnalysis", "Gap analysis"],
  ["policyGenerator", "Policy generator"],
  ["riskScoring", "Risk scoring"],
  ["continuousMonitoring", "Monitoring"],
  ["affordablePricing", "Affordable pricing"],
];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function severityColor(value?: string): ChipColor {
  if (value === "CRITICAL" || value === "HIGH" || value === "ATTENTION") return "error";
  if (value === "MEDIUM" || value === "WATCH") return "warning";
  if (value === "LOW" || value === "STABLE") return "success";
  return "primary";
}

function formatEnum(value?: string | null) {
  if (!value) return "Unknown";

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\w/, (char) => char.toUpperCase());
}

function scoreHelper(score: number) {
  if (score >= 75) return "Critical exposure";
  if (score >= 50) return "High exposure";
  if (score >= 25) return "Moderate exposure";
  return "Low exposure";
}

function MetricCard({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 4, height: "100%", minWidth: 0 }}>
      <Typography variant="h4">{value}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 900 }}>{label}</Typography>
      <Typography variant="caption" color="text.secondary">{helper}</Typography>
    </Paper>
  );
}

function RiskScorePanel({ overview }: { overview: CopilotOverview }) {
  const { riskScoring } = overview;

  return (
    <Paper sx={{ p: 3, borderRadius: 5, height: "100%", minWidth: 0 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="h6">Risk scoring</Typography>
        <Chip label={riskScoring.label} color={severityColor(riskScoring.label)} size="small" />
      </Stack>
      <Typography variant="h3" sx={{ mb: 1 }}>{riskScoring.score}/100</Typography>
      <LinearProgress variant="determinate" value={riskScoring.score} sx={{ height: 10, borderRadius: 999, mb: 2 }} />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{scoreHelper(riskScoring.score)}</Typography>
      <Stack spacing={1}>
        {riskScoring.drivers.slice(0, 4).map((driver) => (
          <Box key={driver.label} sx={{ p: 1.5, borderRadius: 3, bgcolor: "surface.level2", border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ fontWeight: 850 }}>{driver.label}</Typography>
              <Chip label={driver.value} size="small" color={severityColor(driver.impact)} />
            </Stack>
            <Typography variant="caption" color="text.secondary">{driver.description}</Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

function FeatureStatus({ overview }: { overview: CopilotOverview }) {
  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
      {implementedLabels.map(([key, label]) => (
        <Chip
          key={key}
          label={label}
          color={overview.implemented[key] ? "success" : "default"}
          variant={overview.implemented[key] ? "filled" : "outlined"}
          size="small"
        />
      ))}
    </Stack>
  );
}

function RecommendationPanel({ overview }: { overview: CopilotOverview }) {
  return (
    <Paper sx={{ p: 3, borderRadius: 5, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Assistant recommendations</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
        {overview.recommendations.map((item) => (
          <Box key={item.title} sx={{ p: 2, borderRadius: 3, bgcolor: "surface.level2", border: "1px solid", borderColor: "divider", minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{item.title}</Typography>
              <Chip label={item.priority} size="small" color={severityColor(item.priority)} />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{item.description}</Typography>
            <Typography variant="caption">{item.action}</Typography>
          </Box>
        ))}
        {!overview.recommendations.length && (
          <Typography variant="body2" color="text.secondary">No active recommendations right now.</Typography>
        )}
      </Box>
    </Paper>
  );
}

function AssetChips({ mapping }: { mapping: CopilotControlMapping }) {
  const assets = [
    ...mapping.mappedAssets.systems.map((asset) => ({ ...asset, prefix: "System" })),
    ...mapping.mappedAssets.vendors.map((asset) => ({ ...asset, prefix: "Vendor" })),
    ...mapping.mappedAssets.businessProcesses.map((asset) => ({ ...asset, prefix: "Process" })),
  ];

  if (!assets.length) {
    return <Typography variant="caption" color="text.secondary">No mapped assets yet.</Typography>;
  }

  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
      {assets.slice(0, 8).map((asset) => (
        <Chip
          key={`${asset.prefix}-${asset.id}`}
          label={`${asset.prefix}: ${asset.name}`}
          size="small"
          variant="outlined"
          color={severityColor(asset.criticality || undefined)}
        />
      ))}
    </Stack>
  );
}

function ControlMappingPanel({ mappings }: { mappings: CopilotControlMapping[] }) {
  return (
    <Paper sx={{ p: 3, borderRadius: 5, height: "100%", minWidth: 0 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="h6">Automatic control mapping</Typography>
        <Chip label={`${mappings.length} controls`} size="small" color="primary" />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Controls are matched to systems, vendors, and business processes from the workspace.
      </Typography>
      <Stack spacing={1.5}>
        {mappings.slice(0, 8).map((mapping) => (
          <Box key={String(mapping.controlId)} sx={{ p: 2, borderRadius: 3, bgcolor: "surface.level2", border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={1} useFlexGap sx={{ justifyContent: "space-between", flexWrap: "wrap", mb: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{mapping.title}</Typography>
                <Typography variant="caption" color="text.secondary">{mapping.framework} - {mapping.reference} - {formatEnum(mapping.focus)}</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip label={mapping.confidence} size="small" color={severityColor(mapping.confidence === "HIGH" ? "LOW" : "MEDIUM")} />
                <Chip label={mapping.evidenceCoverage.status} size="small" color={mapping.evidenceCoverage.status === "COVERED" ? "success" : "warning"} />
              </Stack>
            </Stack>
            <AssetChips mapping={mapping} />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>{mapping.nextAction}</Typography>
          </Box>
        ))}
        {!mappings.length && <Typography variant="body2" color="text.secondary">Start a framework assessment to create control mappings.</Typography>}
      </Stack>
    </Paper>
  );
}

function GapRow({ gap }: { gap: CopilotGap }) {
  return (
    <Box sx={{ p: 2, borderRadius: 3, bgcolor: "surface.level2", border: "1px solid", borderColor: "divider" }}>
      <Stack direction="row" spacing={1} useFlexGap sx={{ justifyContent: "space-between", flexWrap: "wrap", mb: 0.75 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{gap.sourceName}</Typography>
          <Typography variant="caption" color="text.secondary">{gap.source} - {formatEnum(gap.type)}</Typography>
        </Box>
        <Chip label={gap.severity} size="small" color={severityColor(gap.severity)} />
      </Stack>
      <Typography variant="body2" color="text.secondary">{gap.message}</Typography>
      <Typography variant="caption">{gap.recommendation}</Typography>
    </Box>
  );
}

function SecurityGapPanel({ overview }: { overview: CopilotOverview }) {
  const { securityGapAnalysis } = overview;

  return (
    <Paper sx={{ p: 3, borderRadius: 5, height: "100%", minWidth: 0 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="h6">Security gap analysis</Typography>
        <Chip label={`${securityGapAnalysis.totalGaps} gaps`} color={securityGapAnalysis.totalGaps ? "warning" : "success"} size="small" />
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }, gap: 1, mb: 2 }}>
        <MetricCard label="Critical" value={securityGapAnalysis.summary.critical} helper="Immediate exposure" />
        <MetricCard label="High" value={securityGapAnalysis.summary.high} helper="Priority fixes" />
        <MetricCard label="Medium" value={securityGapAnalysis.summary.medium} helper="Planned fixes" />
        <MetricCard label="Low" value={securityGapAnalysis.summary.low} helper="Backlog" />
      </Box>
      <Stack spacing={1.5}>
        {securityGapAnalysis.gaps.slice(0, 8).map((gap) => <GapRow key={gap.id} gap={gap} />)}
        {!securityGapAnalysis.gaps.length && <Typography variant="body2" color="text.secondary">No gaps detected from current workspace data.</Typography>}
      </Stack>
    </Paper>
  );
}

function MonitoringPanel({ overview }: { overview: CopilotOverview }) {
  const { continuousMonitoring } = overview;

  return (
    <Paper sx={{ p: 3, borderRadius: 5, height: "100%", minWidth: 0 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="h6">Continuous monitoring</Typography>
        <Chip label={continuousMonitoring.health} color={severityColor(continuousMonitoring.health)} size="small" />
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2, mb: 2 }}>
        <MetricCard label="Monitoring coverage" value={`${continuousMonitoring.monitoringCoverage}%`} helper={`${continuousMonitoring.monitoredSystems}/${continuousMonitoring.totalSystems} systems`} />
        <MetricCard label="Critical unmonitored" value={continuousMonitoring.criticalSystemsWithoutMonitoring} helper={`${continuousMonitoring.criticalSystems} critical systems`} />
        <MetricCard label="Logging coverage" value={`${continuousMonitoring.loggingCoverage}%`} helper="Systems with logging" />
        <MetricCard label="Backup coverage" value={`${continuousMonitoring.backupCoverage}%`} helper="Systems with backup" />
      </Box>
      <Stack spacing={1.5}>
        {continuousMonitoring.alerts.slice(0, 6).map((alert) => <GapRow key={alert.id} gap={alert} />)}
        {!continuousMonitoring.alerts.length && <Typography variant="body2" color="text.secondary">No active monitoring alerts.</Typography>}
      </Stack>
    </Paper>
  );
}

function PolicyPreview({ policy }: { policy: GeneratedPolicy }) {
  return (
    <Box sx={{ mt: 2 }}>
      <Stack spacing={1.5}>
        {policy.sections.map((section) => (
          <Box key={section.heading} sx={{ p: 2, borderRadius: 3, bgcolor: "surface.level2", border: "1px solid", borderColor: "divider" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{section.heading}</Typography>
            <Typography variant="body2" color="text.secondary">{section.body}</Typography>
          </Box>
        ))}
      </Stack>
      <TextField
        label="Generated policy markdown"
        value={policy.markdown}
        multiline
        minRows={8}
        fullWidth
        slotProps={{ input: { readOnly: true } }}
        sx={{ mt: 2 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>{policy.disclaimer}</Typography>
    </Box>
  );
}

function PolicyGeneratorPanel({ overview }: { overview: CopilotOverview }) {
  const [template, setTemplate] = useState(overview.policyTemplates[0]?.id || "");
  const [audience, setAudience] = useState<CopilotPolicyAudience>("OPERATING");
  const [includeCompanyContext, setIncludeCompanyContext] = useState(true);
  const [policy, setPolicy] = useState<GeneratedPolicy | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = useMemo(
    () => overview.policyTemplates.find((item) => item.id === template),
    [overview.policyTemplates, template],
  );

  async function handleGenerate() {
    if (!template) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await generatePolicy({
        template,
        audience,
        includeCompanyContext,
      });
      setPolicy(response.policy);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 5, height: "100%", minWidth: 0 }}>
      <Typography variant="h6" gutterBottom>Policy generator</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Draft policy text from active frameworks, assets, gaps, monitoring status, and evidence expectations.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack spacing={2}>
        <FormControl fullWidth>
          <InputLabel id="policy-template-label">Template</InputLabel>
          <Select
            labelId="policy-template-label"
            label="Template"
            value={template}
            onChange={(event) => setTemplate(event.target.value)}
          >
            {overview.policyTemplates.map((item) => (
              <MenuItem key={item.id} value={item.id}>{item.title}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="policy-audience-label">Audience</InputLabel>
          <Select
            labelId="policy-audience-label"
            label="Audience"
            value={audience}
            onChange={(event) => setAudience(event.target.value as CopilotPolicyAudience)}
          >
            <MenuItem value="OPERATING">Operating team</MenuItem>
            <MenuItem value="BOARD">Board summary</MenuItem>
            <MenuItem value="AUDIT">Audit evidence</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Switch
              checked={includeCompanyContext}
              onChange={(event) => setIncludeCompanyContext(event.target.checked)}
            />
          }
          label="Use company context"
        />
        {selectedTemplate && (
          <Box sx={{ p: 2, borderRadius: 3, bgcolor: "surface.level2", border: "1px solid", borderColor: "divider" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{selectedTemplate.description}</Typography>
            <Typography variant="caption" color="text.secondary">
              Evidence: {selectedTemplate.evidenceChecklist.join(", ")}
            </Typography>
          </Box>
        )}
        <Button variant="contained" onClick={handleGenerate} disabled={!template || isGenerating}>
          {isGenerating ? "Generating..." : "Generate policy"}
        </Button>
      </Stack>
      {policy && <PolicyPreview policy={policy} />}
    </Paper>
  );
}

export default function AiComplianceCopilotPage() {
  const [overview, setOverview] = useState<CopilotOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getCopilotOverview()
      .then((data) => {
        if (isMounted) setOverview(data);
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
  }, []);

  if (isLoading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!overview) {
    return <Alert severity="info">No copilot data available yet.</Alert>;
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 1240, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 2, md: 4 }, boxSizing: "border-box" }}>
      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 6, mb: 3 }}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={3} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", lg: "center" } }}>
          <Box sx={{ maxWidth: 760 }}>
            <Chip label="AI-powered compliance assistant" color="primary" sx={{ mb: 2 }} />
            <Typography variant="h3" gutterBottom>Map controls, find gaps, score risk, monitor exposure, and draft policies.</Typography>
            <Typography color="text.secondary">{overview.assistantSummary.message}</Typography>
          </Box>
          <FeatureStatus overview={overview} />
        </Stack>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2, mb: 3 }}>
        <MetricCard label="Active frameworks" value={overview.assistantSummary.activeFrameworks} helper="Frameworks in scope" />
        <MetricCard label="Controls analyzed" value={overview.assistantSummary.controlsAnalyzed} helper="Controls checked by copilot" />
        <MetricCard label="Assets analyzed" value={overview.assistantSummary.assetsAnalyzed} helper="Systems, vendors, processes" />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "0.9fr 1.1fr" }, gap: 3, mb: 3 }}>
        <RiskScorePanel overview={overview} />
        <RecommendationPanel overview={overview} />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" }, gap: 3, mb: 3 }}>
        <ControlMappingPanel mappings={overview.controlMappings} />
        <SecurityGapPanel overview={overview} />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" }, gap: 3 }}>
        <MonitoringPanel overview={overview} />
        <PolicyGeneratorPanel overview={overview} />
      </Box>
    </Box>
  );
}
