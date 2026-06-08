import { useState } from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { submitDemoRequest } from "../../api/demoRequest";
import type { DemoRequestFormValues } from "../../types/demoRequest";
// Public demo request page for potential customers.

// Shared select option structure for dropdown fields.
type Option = {
  value: string;
  labelKey: string;
};

// Supported countries shown in demo request form.
const countries: Option[] = [
  { value: "Denmark", labelKey: "auth.requestDemo.countries.denmark" },
  { value: "Sweden", labelKey: "auth.requestDemo.countries.sweden" },
  { value: "Germany", labelKey: "auth.requestDemo.countries.germany" },
  { value: "Netherlands", labelKey: "auth.requestDemo.countries.netherlands" },
  { value: "France", labelKey: "auth.requestDemo.countries.france" },
];

// Predefined job title options for demo requests.
const jobTitles: Option[] = [
  { value: "CEO", labelKey: "auth.requestDemo.jobTitles.ceo" },
  { value: "CTO", labelKey: "auth.requestDemo.jobTitles.cto" },
  { value: "CFO", labelKey: "auth.requestDemo.jobTitles.cfo" },
  { value: "CISO", labelKey: "auth.requestDemo.jobTitles.ciso" },
  { value: "DPO", labelKey: "auth.requestDemo.jobTitles.dpo" },
  {
    value: "Compliance manager",
    labelKey: "auth.requestDemo.jobTitles.complianceManager",
  },
  { value: "IT manager", labelKey: "auth.requestDemo.jobTitles.itManager" },
  {
    value: "Security manager",
    labelKey: "auth.requestDemo.jobTitles.securityManager",
  },
  {
    value: "Legal counsel",
    labelKey: "auth.requestDemo.jobTitles.legalCounsel",
  },
  { value: "Other", labelKey: "auth.requestDemo.jobTitles.other" },
];

// Form state including optional custom job title input.
type RequestDemoFormState = DemoRequestFormValues & {
  customJobTitle: string;
};

// Validation errors for demo request form fields.
type DemoRequestFormErrors = Partial<
  Record<keyof RequestDemoFormState, string>
>;

// Default empty form state.
const initialValues: RequestDemoFormState = {
  email: "",
  firstName: "",
  lastName: "",
  companyName: "",
  jobTitle: "",
  customJobTitle: "",
  country: "",
};

export default function RequestDemoPage() {
  const { t } = useTranslation();
  // Stores demo request form input values.
  const [values, setValues] = useState<RequestDemoFormState>(initialValues);
  const [errors, setErrors] = useState<DemoRequestFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Updates form values and clears related errors/messages.
  const handleChange =
    (field: keyof RequestDemoFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      setValues((prev) => ({
        ...prev,
        [field]: value,
      }));

      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: "",
        }));
      }

      if (submitSuccess) setSubmitSuccess("");
      if (submitError) setSubmitError("");
    };

  // Validates demo request form before submission.
  const validate = (): DemoRequestFormErrors => {
    const newErrors: DemoRequestFormErrors = {};

    if (!values.email.trim()) {
      newErrors.email = t("auth.requestDemo.errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      newErrors.email = t("auth.requestDemo.errors.invalidEmail");
    }

    if (!values.firstName.trim()) {
      newErrors.firstName = t("auth.requestDemo.errors.firstNameRequired");
    }

    if (!values.lastName.trim()) {
      newErrors.lastName = t("auth.requestDemo.errors.lastNameRequired");
    }

    if (!values.companyName.trim()) {
      newErrors.companyName = t("auth.requestDemo.errors.companyNameRequired");
    }

    if (!values.jobTitle) {
      newErrors.jobTitle = t("auth.requestDemo.errors.jobTitleRequired");
    }

    // Require custom job title when "Other" is selected.
    if (values.jobTitle === "Other" && !values.customJobTitle.trim()) {
      newErrors.customJobTitle = t(
        "auth.requestDemo.errors.customJobTitleRequired",
      );
    }
    return newErrors;
  };

  // Submits demo access request to backend.
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSubmitSuccess("");
    setSubmitError("");

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Use custom job title when user selected "Other".
      const finalJobTitle =
        values.jobTitle === "Other"
          ? values.customJobTitle.trim()
          : values.jobTitle;

      await submitDemoRequest({
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        companyName: values.companyName,
        country: values.country,
        jobTitle: finalJobTitle,
      });

      setSubmitSuccess(t("auth.requestDemo.success"));
      // Reset form after successful submission.
      setValues(initialValues);
      setErrors({});
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : t("auth.requestDemo.errors.submitFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 3,
          width: "100%",
          maxWidth: 500,
        }}
      >
        <Typography variant="h5" gutterBottom>
          {t("auth.requestDemo.title")}
        </Typography>

        <Typography variant="body2" sx={{ mb: 3 }}>
          {t("auth.requestDemo.subtitle")}
        </Typography>

        {/* Demo request form */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <TextField
            label={t("auth.requestDemo.email")}
            type="email"
            fullWidth
            value={values.email}
            onChange={handleChange("email")}
            error={!!errors.email}
            helperText={errors.email}
            autoComplete="email"
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label={t("auth.requestDemo.firstName")}
              fullWidth
              value={values.firstName}
              onChange={handleChange("firstName")}
              error={!!errors.firstName}
              helperText={errors.firstName}
              autoComplete="given-name"
            />

            <TextField
              label={t("auth.requestDemo.lastName")}
              fullWidth
              value={values.lastName}
              onChange={handleChange("lastName")}
              error={!!errors.lastName}
              helperText={errors.lastName}
              autoComplete="family-name"
            />
          </Box>

          <TextField
            label={t("auth.requestDemo.companyName")}
            fullWidth
            value={values.companyName}
            onChange={handleChange("companyName")}
            error={!!errors.companyName}
            helperText={errors.companyName}
            autoComplete="organization"
          />

          <TextField
            select
            label={t("auth.requestDemo.jobTitle")}
            value={values.jobTitle}
            onChange={handleChange("jobTitle")}
            error={!!errors.jobTitle}
            helperText={errors.jobTitle}
            fullWidth
          >
            <MenuItem value="">{t("auth.requestDemo.selectJobTitle")}</MenuItem>

            {jobTitles.map((title) => (
              <MenuItem key={title.value} value={title.value}>
                {t(title.labelKey)}
              </MenuItem>
            ))}
          </TextField>

          {/* Custom job title input */}
          {values.jobTitle === "Other" && (
            <TextField
              label={t("auth.requestDemo.yourJobTitle")}
              value={values.customJobTitle}
              onChange={handleChange("customJobTitle")}
              error={!!errors.customJobTitle}
              helperText={errors.customJobTitle}
              fullWidth
            />
          )}

          <TextField
            select
            label={t("auth.requestDemo.country")}
            fullWidth
            value={values.country}
            onChange={handleChange("country")}
          >
            <MenuItem value="">{t("auth.requestDemo.selectCountry")}</MenuItem>

            {countries.map((country) => (
              <MenuItem key={country.value} value={country.value}>
                {t(country.labelKey)}
              </MenuItem>
            ))}
          </TextField>

          <Button
            type="submit"
            variant="contained"
            size="large"
            sx={{ mt: 2 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                {t("auth.requestDemo.sending")}
              </Box>
            ) : (
              t("auth.requestDemo.submit")
            )}
          </Button>

          {submitSuccess && <Alert severity="success">{submitSuccess}</Alert>}
          {submitError && <Alert severity="error">{submitError}</Alert>}
        </Box>
      </Paper>
    </Box>
  );
}
