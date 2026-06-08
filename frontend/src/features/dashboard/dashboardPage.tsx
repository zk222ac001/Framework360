import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { getDashboard } from "../../api/dashboard";
import type { DashboardResponse } from "../../types/dashboard";
import { useTranslation } from "react-i18next";
// Dashboard page showing compliance progress and active frameworks.

// Converts unknown errors into readable messages.
function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

// Ensures scores stay within 0-100 percentage range.
function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score || 0)));
}

// Identifies frameworks that count towards the EU law score.
function isEuLawFramework(category?: string | null) {
  return category?.trim().toLowerCase() === "eu law";
}

// Calculates average percentage score from multiple frameworks.
function averageScore(scores: number[]) {
  if (scores.length === 0) return 0;

  const total = scores.reduce((sum, score) => sum + clampScore(score), 0);
  return clampScore(total / scores.length);
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data when page mounts.
  useEffect(() => {
    // Prevent state updates after component unmounts.
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

  // Frameworks categorized as mandatory EU law compliance.
  const euLawFrameworks =
    dashboard?.frameworks.filter((framework) =>
      isEuLawFramework(framework.category),
    ) || [];

  // Frameworks categorized as voluntary standards or certifications.
  const voluntaryFrameworks =
    dashboard?.frameworks.filter(
      (framework) => !isEuLawFramework(framework.category),
    ) || [];

  // Average score for EU law frameworks.
  const lawScore = averageScore(
    euLawFrameworks.map((framework) => framework.score),
  );

  // Average score for voluntary/certification frameworks.
  const certificateScore = averageScore(
    voluntaryFrameworks.map((framework) => framework.score),
  );

  // Show loading indicator while dashboard data is loading.
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Dashboard score summary */}
      <Box sx={{ display: "flex", gap: 3, mb: 4, flexWrap: "wrap" }}>
        <Paper
          elevation={3}
          sx={{ flex: 1, minWidth: 280, p: 3, borderRadius: 3 }}
        >
          <Typography variant="h6" gutterBottom>
            {t("dashboard.euLawScore")}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            {lawScore}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={lawScore}
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
            {t("dashboard.euLawScoreDescription")}
          </Typography>
        </Paper>

        <Paper
          elevation={3}
          sx={{ flex: 1, minWidth: 280, p: 3, borderRadius: 3 }}
        >
          <Typography variant="h6" gutterBottom>
            {t("dashboard.certificateScore")}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            {certificateScore}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={certificateScore}
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
            {t("dashboard.certificateScoreDescription")}
          </Typography>
        </Paper>
      </Box>

      {/* Framework section header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {t("dashboard.frameworks")}
        </Typography>

        <Button variant="contained" onClick={() => navigate("/frameworks/add")}>
          {t("dashboard.addFramework")}
        </Button>
      </Box>

      {/* Empty state or framework cards */}
      {!dashboard || dashboard.frameworks.length === 0 ? (
        <Paper
          elevation={1}
          sx={{
            p: 4,
            borderRadius: 3,
            border: "2px dashed",
            textAlign: "center",
          }}
        >
          <Typography variant="h6" gutterBottom>
            {t("dashboard.noFrameworks")}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {t("dashboard.noFrameworksDescription")}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/frameworks/add")}
          >
            {t("dashboard.addFirstFramework")}
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 1 }}>
          {/* Framework progress cards */}
          {dashboard.frameworks.map((framework) => {
            // Normalize framework score before rendering progress.
            const score = clampScore(framework.score);
            // Framework is only shown as completed when status and score both confirm it.
            const isCompleted =
              framework.status === "COMPLETED" && score === 100;

            return (
              <Paper
                key={framework.code}
                elevation={3}
                onClick={() => navigate(`/frameworks/${framework.code}`)}
                sx={{
                  minWidth: 320,
                  p: 3,
                  borderRadius: 3,
                  flexShrink: 0,
                  cursor: "pointer",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 1,
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {framework.name}
                    </Typography>
                    {framework.category && (
                      <Typography variant="body2" color="text.secondary">
                        {framework.category}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={
                      isCompleted
                        ? t("dashboard.completed")
                        : t("dashboard.inProgress")
                    }
                    color={isCompleted ? "success" : "primary"}
                    size="small"
                  />
                </Box>

                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <Box sx={{ width: "100%" }}>
                    <LinearProgress
                      variant="determinate"
                      value={score}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {score}%
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(`/frameworks/${framework.code}`);
                  }}
                >
                  {isCompleted ? t("dashboard.view") : t("dashboard.continue")}
                </Button>
              </Paper>
            );
          })}

          {/* Add framework shortcut card */}
          <Paper
            elevation={1}
            onClick={() => navigate("/frameworks/add")}
            sx={{
              minWidth: 300,
              p: 3,
              borderRadius: 3,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px dashed",
              cursor: "pointer",
            }}
          >
            <Typography variant="h6" color="text.secondary">
              {t("dashboard.addNewFramework")}
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
