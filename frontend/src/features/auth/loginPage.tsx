import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useAuth } from "../../context/useAuth";
// Authentication page for user login.

// Form state structure for login inputs.
type LoginFormValues = { email: string; password: string; rememberMe: boolean };
// Validation errors for login form fields.
type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Stores login form values.
  const [values, setValues] = useState<LoginFormValues>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Updates form values and clears validation errors.
  const handleChange =
    (field: keyof LoginFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "rememberMe" ? event.target.checked : event.target.value;

      setValues((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
      setSubmitError("");
    };

  // Validates login form before authentication request.
  const validate = (): LoginFormErrors => {
    const newErrors: LoginFormErrors = {};

    if (!values.email.trim()) {
      newErrors.email = t("auth.login.errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      newErrors.email = t("auth.login.errors.invalidEmail");
    }

    if (!values.password.trim()) {
      newErrors.password = t("auth.login.errors.passwordRequired");
    }

    return newErrors;
  };

  // Determines where user should be redirected after login.
  const getRedirectPath = (user: {
    role: string;
    mustChangePassword: boolean;
    onboardingCompleted: boolean;
  }) => {
    if (user.role === "PLATFORM_ADMIN") return "/admin";
    if (user.mustChangePassword) return "/change-password";
    if (!user.onboardingCompleted) return "/onboarding/select-product";
    return "/dashboard";
  };

  // Handles login request and redirects authenticated user.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSubmitError("");

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    try {
      setIsSubmitting(true);

      const user = await login(
        values.email,
        values.password,
        values.rememberMe,
      );

      // Redirect back to originally requested protected route if available.
      const from = (location.state as { from?: { pathname?: string } } | null)
        ?.from?.pathname;

      // Navigate user to appropriate destination after login.
      navigate(from || getRedirectPath(user), { replace: true });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : t("auth.login.errors.loginFailed"),
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
        sx={{ p: 4, borderRadius: 3, width: "100%", maxWidth: 450 }}
      >
        <Typography variant="h5" gutterBottom>
          {t("auth.login.title")}
        </Typography>

        <Typography variant="body2" sx={{ mb: 3 }}>
          {t("auth.login.subtitle")}
        </Typography>

        {/* Login form */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label={t("auth.login.email")}
            type="email"
            fullWidth
            value={values.email}
            onChange={handleChange("email")}
            error={!!errors.email}
            helperText={errors.email}
            autoComplete="email"
          />

          <TextField
            label={t("auth.login.password")}
            type="password"
            fullWidth
            value={values.password}
            onChange={handleChange("password")}
            error={!!errors.password}
            helperText={errors.password}
            autoComplete="current-password"
          />

          {/* Persistent login option */}
          <FormControlLabel
            control={
              <Checkbox
                checked={values.rememberMe}
                onChange={handleChange("rememberMe")}
              />
            }
            label={t("auth.login.rememberMe")}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                {t("auth.login.signingIn")}
              </Box>
            ) : (
              t("auth.login.signIn")
            )}
          </Button>

          {submitError && <Alert severity="error">{submitError}</Alert>}

          <Typography variant="body2" sx={{ textAlign: "center", mt: 1 }}>
            {t("auth.login.needAccess")}{" "}
            <Link component={RouterLink} to="/requestdemo">
              {t("auth.login.requestDemo")}
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
