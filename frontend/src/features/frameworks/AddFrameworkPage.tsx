import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { getDashboard } from "../../api/dashboard";
import { getFrameworks, startFrameworkAssessment } from "../../api/frameworks";
import { useTranslation } from "react-i18next";
import type { FrameworkDefinition } from "../../types/framework";
import FrameworkCard from "./components/FrameworkCard";
// Page for adding new compliance frameworks to the company dashboard.

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

// Framework codes treated as mandatory EU law frameworks.
const lawFrameworkCodes = [
  "GDPR",
  "NIS2",
  "DORA",
  "AI_ACT",
  "CRA",
  "DATA_ACT",
  "EIDAS",
  "CER",
];

// Checks whether framework belongs to required law category.
function isLawFramework(code: string) {
  return lawFrameworkCodes.includes(code);
}

export default function AddFrameworkPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [frameworks, setFrameworks] = useState<FrameworkDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingCode, setStartingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedCodes, setAddedCodes] = useState<Set<string>>(new Set());

  // Loads available frameworks and already added dashboard frameworks.
  useEffect(() => {
    let isMounted = true;

    Promise.all([getFrameworks(), getDashboard()])
      .then(([frameworkData, dashboardData]) => {
        if (!isMounted) return;

        setFrameworks(frameworkData);
        setAddedCodes(
          new Set(dashboardData.frameworks.map((item) => item.code)),
        );
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

  // Starts selected framework assessment and navigates to it.
  async function handleStart(code: string) {
    setStartingCode(code);
    setError(null);

    try {
      await startFrameworkAssessment(code);
      navigate(`/frameworks/${code}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setStartingCode(null);
    }
  }

  // Hide frameworks that already exist on the dashboard.
  const availableFrameworks = frameworks.filter(
    (framework) => !addedCodes.has(framework.code),
  );

  // Available frameworks required by law.
  const requiredByLaw = availableFrameworks.filter((framework) =>
    isLawFramework(framework.code),
  );

  // Recommended non-law frameworks for the company.
  const relevantForCompany = availableFrameworks.filter(
    (framework) =>
      framework.recommended === true && !isLawFramework(framework.code),
  );

  // Remaining optional frameworks.
  const otherFrameworks = availableFrameworks.filter(
    (framework) =>
      !isLawFramework(framework.code) && framework.recommended !== true,
  );

  // Renders framework section only when it contains items.
  function renderSection(title: string, items: FrameworkDefinition[]) {
    if (!items.length) return null;

    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          {title}
        </Typography>

        <Grid container spacing={3}>
          {items.map((framework) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={framework.id}>
              <FrameworkCard
                framework={framework}
                isStarting={startingCode === framework.code}
                onStart={handleStart}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
          {t("frameworksPage.add.title")}
        </Typography>
        <Typography color="text.secondary">
          {t("frameworksPage.add.subtitle")}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Framework selection content states */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : availableFrameworks.length === 0 ? (
        <Alert severity="info">{t("frameworksPage.add.allAdded")}</Alert>
      ) : (
        <Stack spacing={5}>
          {renderSection(t("frameworksPage.add.requiredByLaw"), requiredByLaw)}
          {renderSection(
            t("frameworksPage.add.relevantForCompany"),
            relevantForCompany,
          )}
          {renderSection(
            t("frameworksPage.add.otherFrameworks"),
            otherFrameworks,
          )}
        </Stack>
      )}
    </Box>
  );
}
