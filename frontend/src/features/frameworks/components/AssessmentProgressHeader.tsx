import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { AssessmentStatus } from "../../../types/framework";
import {
  formatAssessmentStatus,
  formatFrameworkCode,
} from "../../../utils/formatters";
import { useTranslation } from "react-i18next";
// Header showing assessment title, status and overall progress.

// Progress header data passed from assessment page.
type Props = {
  frameworkName: string;
  frameworkCode: string;
  status: AssessmentStatus;
  score: number;
  currentSection: number;
  totalSections: number;
};

export default function AssessmentProgressHeader({
  frameworkName,
  frameworkCode,
  status,
  score,
  currentSection,
  totalSections,
}: Props) {
  const { t } = useTranslation();
  // Keeps progress score within valid 0-100 range.
  const safeScore = Math.max(0, Math.min(100, Math.round(score || 0)));

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
      {/* Assessment title and status */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="overline" color="text.secondary">
            {formatFrameworkCode(frameworkCode)}{" "}
            {t("frameworksPage.assessment.assessment")}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {frameworkName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("frameworksPage.assessment.section")} {currentSection}{" "}
            {t("frameworksPage.assessment.of")} {totalSections}
          </Typography>
        </Box>
        <Chip
          label={formatAssessmentStatus(status)}
          color={status === "COMPLETED" ? "success" : "primary"}
        />
      </Box>

      {/* Overall assessment progress */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ width: "100%" }}>
          <LinearProgress
            variant="determinate"
            value={safeScore}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
        <Typography sx={{ fontWeight: 700 }}>{safeScore}%</Typography>
      </Box>
    </Paper>
  );
}
