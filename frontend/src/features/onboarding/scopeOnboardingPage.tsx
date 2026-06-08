import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import {
  getCompanyScope,
  saveCompanyScope,
  updateCompanyScope,
} from "../../api/onboarding";
import type {
  EmployeeCount,
  SaveCompanyScopePayload,
} from "../../types/framework";
// Onboarding page for collecting company scope and compliance signals.

// Company size options used for compliance scoping.
const employeeCountOptions: Array<{
  value: EmployeeCount;
  labelKey: string;
}> = [
  {
    value: "ONE_TO_NINE",
    labelKey: "onboarding.scope.employeeCount.oneToNine",
  },
  {
    value: "TEN_TO_FORTY_NINE",
    labelKey: "onboarding.scope.employeeCount.tenToFortyNine",
  },
  {
    value: "FIFTY_TO_TWO_FORTY_NINE",
    labelKey: "onboarding.scope.employeeCount.fiftyToTwoFortyNine",
  },
  {
    value: "TWO_FIFTY_PLUS",
    labelKey: "onboarding.scope.employeeCount.twoFiftyPlus",
  },
  { value: "UNKNOWN", labelKey: "onboarding.scope.employeeCount.unknown" },
];

// Scope questions used to improve framework recommendations.
const yesNoQuestions: Array<{
  key: keyof Omit<SaveCompanyScopePayload, "employeeCount">;
  labelKey: string;
  helperKey: string;
}> = [
  {
    key: "processesPersonalData",
    labelKey: "onboarding.scope.questions.processesPersonalData.label",
    helperKey: "onboarding.scope.questions.processesPersonalData.helper",
  },
  {
    key: "handlesSensitiveData",
    labelKey: "onboarding.scope.questions.handlesSensitiveData.label",
    helperKey: "onboarding.scope.questions.handlesSensitiveData.helper",
  },
  {
    key: "acceptsCardPayments",
    labelKey: "onboarding.scope.questions.acceptsCardPayments.label",
    helperKey: "onboarding.scope.questions.acceptsCardPayments.helper",
  },
  {
    key: "usesAiSystems",
    labelKey: "onboarding.scope.questions.usesAiSystems.label",
    helperKey: "onboarding.scope.questions.usesAiSystems.helper",
  },
  {
    key: "servesFinancialCustomers",
    labelKey: "onboarding.scope.questions.servesFinancialCustomers.label",
    helperKey: "onboarding.scope.questions.servesFinancialCustomers.helper",
  },
  {
    key: "isDigitalServiceProvider",
    labelKey: "onboarding.scope.questions.isDigitalServiceProvider.label",
    helperKey: "onboarding.scope.questions.isDigitalServiceProvider.helper",
  },
  {
    key: "operatesCriticalInfrastructure",
    labelKey: "onboarding.scope.questions.operatesCriticalInfrastructure.label",
    helperKey:
      "onboarding.scope.questions.operatesCriticalInfrastructure.helper",
  },
  {
    key: "hasEuCustomers",
    labelKey: "onboarding.scope.questions.hasEuCustomers.label",
    helperKey: "onboarding.scope.questions.hasEuCustomers.helper",
  },
  {
    key: "usesCloudProviders",
    labelKey: "onboarding.scope.questions.usesCloudProviders.label",
    helperKey: "onboarding.scope.questions.usesCloudProviders.helper",
  },
  {
    key: "hasCriticalSuppliers",
    labelKey: "onboarding.scope.questions.hasCriticalSuppliers.label",
    helperKey: "onboarding.scope.questions.hasCriticalSuppliers.helper",
  },
];

// Default scope values before backend data is loaded.
const defaultValues: SaveCompanyScopePayload = {
  employeeCount: "UNKNOWN",
  processesPersonalData: false,
  handlesSensitiveData: false,
  acceptsCardPayments: false,
  usesAiSystems: false,
  servesFinancialCustomers: false,
  isDigitalServiceProvider: false,
  operatesCriticalInfrastructure: false,
  hasEuCustomers: true,
  usesCloudProviders: false,
  hasCriticalSuppliers: false,
};

export default function ScopeOnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [values, setValues] = useState<SaveCompanyScopePayload>(defaultValues);
  const [hasExistingScope, setHasExistingScope] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Loads existing company scope if it has already been saved.
  useEffect(() => {
    let mounted = true;

    getCompanyScope()
      .then((data) => {
        if (!mounted) return;

        // Populate form when existing scope data is available.
        if (data.scope) {
          setHasExistingScope(true);
          setValues({
            employeeCount: data.scope.employeeCount ?? "UNKNOWN",
            processesPersonalData: data.scope.processesPersonalData ?? false,
            handlesSensitiveData: data.scope.handlesSensitiveData ?? false,
            acceptsCardPayments: data.scope.acceptsCardPayments ?? false,
            usesAiSystems: data.scope.usesAiSystems ?? false,
            servesFinancialCustomers:
              data.scope.servesFinancialCustomers ?? false,
            isDigitalServiceProvider:
              data.scope.isDigitalServiceProvider ?? false,
            operatesCriticalInfrastructure:
              data.scope.operatesCriticalInfrastructure ?? false,
            hasEuCustomers: data.scope.hasEuCustomers ?? true,
            usesCloudProviders: data.scope.usesCloudProviders ?? false,
            hasCriticalSuppliers: data.scope.hasCriticalSuppliers ?? false,
          });
        }
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : t("onboarding.scope.errors.loadFailed"),
        );
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [t]);

  // Creates or updates company scope and continues onboarding.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setError("");

      // Update existing scope, otherwise create it for the first time.
      if (hasExistingScope) {
        await updateCompanyScope(values);
      } else {
        await saveCompanyScope(values);
      }
      navigate("/onboarding/frameworks", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("onboarding.scope.errors.saveFailed"),
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 850, mx: "auto" }}>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom>
          {t("onboarding.scope.title")}
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t("onboarding.scope.subtitle")}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Company scope form */}
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Company size */}
            <TextField
              select
              label={t("onboarding.scope.companySize")}
              value={values.employeeCount ?? "UNKNOWN"}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  employeeCount: event.target.value as EmployeeCount,
                }))
              }
              fullWidth
            >
              {employeeCountOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </MenuItem>
              ))}
            </TextField>

            {/* Compliance scope questions */}
            <Stack spacing={2}>
              {yesNoQuestions.map((question) => (
                <Paper
                  key={question.key}
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 2 }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(values[question.key])}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            [question.key]: event.target.checked,
                          }))
                        }
                      />
                    }
                    label={t(question.labelKey)}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {t(question.helperKey)}
                  </Typography>
                </Paper>
              ))}
            </Stack>

            {/* Onboarding navigation actions */}
            <Stack direction="row" spacing={2}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate("/onboarding/company")}
              >
                {t("onboarding.scope.back")}
              </Button>

              <Button type="submit" variant="contained" disabled={isSaving}>
                {isSaving
                  ? t("onboarding.scope.saving")
                  : t("onboarding.scope.continue")}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
