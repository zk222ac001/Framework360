import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { submitCompanyOnboarding } from "../../api/onboarding";
import { useAuth } from "../../context/useAuth";
import { formatSector } from "../../utils/formatters";
import { useTranslation } from "react-i18next";
// Onboarding page for collecting basic company information.

// Company onboarding form values.
type FormValues = {
  companyName: string;
  cvr: string;
  sector: string;
  country: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

// Supported company sectors used for framework recommendations.
const sectors = [
  "FINANCE",
  "INSURANCE",
  "BANKING",
  "HEALTHCARE",
  "PHARMA",
  "UTILITIES",
  "WATER",
  "TRANSPORT",
  "LOGISTICS",
  "IT",
  "TELECOM",
  "DIGITAL_INFRASTRUCTURE",
  "CLOUD",
  "PUBLIC",
  "GOVERNMENT",
  "MUNICIPAL",
  "MANUFACTURING",
  "INDUSTRIAL",
  "RETAIL",
  "ECOMMERCE",
  "EDUCATION",
  "MEDIA",
  "FOOD",
  "OTHER",
];

// Country options shown in the company onboarding form.
const countries = [
  { value: "Denmark", labelKey: "onboarding.company.countries.denmark" },
  { value: "Sweden", labelKey: "onboarding.company.countries.sweden" },
  { value: "Germany", labelKey: "onboarding.company.countries.germany" },
  {
    value: "Netherlands",
    labelKey: "onboarding.company.countries.netherlands",
  },
  { value: "France", labelKey: "onboarding.company.countries.france" },
];

export default function CompanyOnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [values, setValues] = useState<FormValues>({
    companyName: user?.company?.name || "",
    cvr: "",
    sector: "",
    country: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Updates form values and clears related errors.
  const handleChange =
    (field: keyof FormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));

      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));

      setSubmitError("");
    };

  // Validates required company onboarding fields.
  const validate = () => {
    const newErrors: FormErrors = {};

    if (!values.companyName.trim()) {
      newErrors.companyName = t(
        "onboarding.company.errors.companyNameRequired",
      );
    }

    if (!values.sector.trim()) {
      newErrors.sector = t("onboarding.company.errors.sectorRequired");
    }

    return newErrors;
  };

  // Saves company onboarding data and continues to scope setup.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (validationErrors && Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);

      await submitCompanyOnboarding({
        companyName: values.companyName,
        cvr: values.cvr,
        sector: values.sector,
        country: values.country,
      });

      await refreshUser();
      navigate("/onboarding/scope", { replace: true });
    } catch (error) {
      console.error(error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : t("onboarding.company.errors.saveFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom>
          {t("onboarding.company.title")}
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          {t("onboarding.company.subtitle")}
        </Typography>

        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        {/* Company onboarding form */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label={t("onboarding.company.companyName")}
            value={values.companyName}
            onChange={handleChange("companyName")}
            error={!!errors.companyName}
            helperText={errors.companyName}
            fullWidth
          />

          <TextField
            label={t("onboarding.company.cvr")}
            value={values.cvr}
            onChange={handleChange("cvr")}
            fullWidth
          />

          <TextField
            select
            label={t("onboarding.company.sector")}
            value={values.sector}
            onChange={handleChange("sector")}
            error={!!errors.sector}
            helperText={errors.sector}
            fullWidth
          >
            <MenuItem value="">{t("onboarding.company.selectSector")}</MenuItem>
            {sectors.map((sector) => (
              <MenuItem key={sector} value={sector}>
                {formatSector(sector)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label={t("onboarding.company.country")}
            fullWidth
            value={values.country}
            onChange={handleChange("country")}
          >
            <MenuItem value="">
              {t("onboarding.company.selectCountry")}
            </MenuItem>
            {countries.map((country) => (
              <MenuItem key={country.value} value={country.value}>
                {t(country.labelKey)}
              </MenuItem>
            ))}
          </TextField>

          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting
              ? t("onboarding.company.saving")
              : t("onboarding.company.complete")}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
