import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { changePassword } from "../../api/auth";
import { useAuth } from "../../context/useAuth";
// Page for updating user password.

// Form state structure for password change inputs.
type FormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

// Validation errors for password form fields.
type FormErrors = Partial<Record<keyof FormValues, string>>;

export default function ChangePasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();

  // Stores password form input values.
  const [values, setValues] = useState<FormValues>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Updates form values and clears related validation errors.
  const handleChange =
    (field: keyof FormValues) => (event: ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));

      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));

      setSubmitError("");
      setSubmitSuccess("");
    };

  // Validates password form before submission.
  const validate = () => {
    const newErrors: FormErrors = {};

    if (!values.currentPassword.trim()) {
      newErrors.currentPassword = t(
        "auth.changePassword.errors.currentRequired",
      );
    }

    if (!values.newPassword.trim()) {
      newErrors.newPassword = t("auth.changePassword.errors.newRequired");
    } else if (values.newPassword.length < 8) {
      newErrors.newPassword = t("auth.changePassword.errors.minLength");
    }

    if (!values.confirmPassword.trim()) {
      newErrors.confirmPassword = t(
        "auth.changePassword.errors.confirmRequired",
      );
    } else if (values.newPassword !== values.confirmPassword) {
      newErrors.confirmPassword = t(
        "auth.changePassword.errors.passwordsDoNotMatch",
      );
    }

    return newErrors;
  };

  // Submits password update request to backend.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    try {
      setIsSubmitting(true);

      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      // Refresh authentication state after successful password change.
      await refreshUser();

      setSubmitSuccess(t("auth.changePassword.success"));

      // Continue onboarding flow after password update.
      navigate("/onboarding/select-product", { replace: true });
    } catch (error) {
      console.error(error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : t("auth.changePassword.errors.changeFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: 2,
      }}
    >
      <Paper sx={{ width: "100%", maxWidth: 500, p: 4, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom>
          {t("auth.changePassword.title")}
        </Typography>

        <Typography variant="body2" sx={{ mb: 3 }}>
          {user?.mustChangePassword
            ? t("auth.changePassword.temporarySubtitle")
            : t("auth.changePassword.normalSubtitle")}
        </Typography>

        {/* Password change form */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label={t("auth.changePassword.currentPassword")}
            type="password"
            value={values.currentPassword}
            onChange={handleChange("currentPassword")}
            error={!!errors.currentPassword}
            helperText={errors.currentPassword}
            fullWidth
          />

          <TextField
            label={t("auth.changePassword.newPassword")}
            type="password"
            value={values.newPassword}
            onChange={handleChange("newPassword")}
            error={!!errors.newPassword}
            helperText={errors.newPassword}
            fullWidth
          />

          <TextField
            label={t("auth.changePassword.confirmNewPassword")}
            type="password"
            value={values.confirmPassword}
            onChange={handleChange("confirmPassword")}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            fullWidth
          />

          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                {t("auth.changePassword.saving")}
              </Box>
            ) : (
              t("auth.changePassword.savePassword")
            )}
          </Button>

          {submitSuccess && <Alert severity="success">{submitSuccess}</Alert>}
          {submitError && <Alert severity="error">{submitError}</Alert>}
        </Box>
      </Paper>
    </Box>
  );
}
