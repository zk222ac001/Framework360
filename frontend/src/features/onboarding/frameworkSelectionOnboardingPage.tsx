import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  getRecommendedOnboardingFrameworks,
  submitOnboardingFrameworks,
} from "../../api/onboarding";
import { useAuth } from "../../context/useAuth";
import type { FrameworkRecommendation } from "../../types/framework";
import { formatFrameworkCode } from "../../utils/formatters";
import { useTranslation } from "react-i18next";
// Onboarding page for selecting recommended compliance frameworks.

export default function FrameworkSelectionOnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [frameworks, setFrameworks] = useState<FrameworkRecommendation[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Loads recommended frameworks based on company profile and scope.
  useEffect(() => {
    let mounted = true;
    getRecommendedOnboardingFrameworks()
      .then((data) => {
        if (!mounted) return;

        // Merge required, recommended and optional frameworks into one list.
        const allFrameworks = [
          ...data.required,
          ...data.recommended,
          ...data.other,
        ];

        setFrameworks(allFrameworks);

        // Preselect required and recommended frameworks by default.
        const defaults = [...data.required, ...data.recommended].map(
          (item) => item.code,
        );

        setSelected(
          defaults.length
            ? defaults
            : allFrameworks.slice(0, 1).map((item) => item.code),
        );
      })
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : t("onboarding.frameworks.errors.loadFailed"),
        ),
      )
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [t]);

  // Toggles framework selection on and off.
  function toggle(code: string) {
    setSelected((prev) =>
      prev.includes(code)
        ? prev.filter((item) => item !== code)
        : [...prev, code],
    );
  }

  // Submits selected frameworks and completes onboarding.
  async function complete() {
    if (!selected.length) {
      setError(t("onboarding.frameworks.errors.selectOne"));
      return;
    }

    try {
      setSaving(true);
      setError("");

      await submitOnboardingFrameworks({
        frameworkCodes: selected,
      });

      await refreshUser();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("onboarding.frameworks.errors.completeFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        {t("onboarding.frameworks.title")}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t("onboarding.frameworks.subtitle")}
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Selectable framework recommendations */}
      <Stack spacing={2}>
        {frameworks.map((framework) => (
          <Paper
            key={framework.code}
            onClick={() => toggle(framework.code)}
            sx={{
              p: 3,
              borderRadius: 3,
              cursor: "pointer",
              border: selected.includes(framework.code)
                ? "2px solid"
                : "1px solid",
            }}
          >
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
              <Checkbox checked={selected.includes(framework.code)} />
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <Typography variant="h6">{framework.name}</Typography>
                  <Chip
                    label={formatFrameworkCode(framework.code)}
                    size="small"
                  />
                  {framework.sectorCategory === "REQUIRED" && (
                    <Chip
                      label={t("onboarding.frameworks.required")}
                      size="small"
                      color="error"
                    />
                  )}

                  {framework.sectorCategory === "RECOMMENDED" && (
                    <Chip
                      label={t("onboarding.frameworks.recommended")}
                      size="small"
                      color="success"
                    />
                  )}

                  {framework.sectorCategory === "OTHER" && (
                    <Chip
                      label={t("onboarding.frameworks.other")}
                      size="small"
                    />
                  )}

                  <Chip
                    label={`${t("onboarding.frameworks.confidence")}: ${framework.confidence}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                {framework.category && (
                  <Typography variant="body2" color="text.secondary">
                    {framework.category}
                  </Typography>
                )}
                {framework.description && (
                  <Typography sx={{ mt: 1 }}>
                    {framework.description}
                  </Typography>
                )}

                {framework.reason && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {framework.reason}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        ))}
      </Stack>

      {/* Complete onboarding action */}
      <Button
        variant="contained"
        sx={{ mt: 3 }}
        disabled={!selected.length || saving}
        onClick={complete}
      >
        {saving
          ? t("onboarding.frameworks.saving")
          : t("onboarding.frameworks.complete")}
      </Button>
    </Box>
  );
}
