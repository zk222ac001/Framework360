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
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { useAuth } from "../../context/useAuth";

type LoginFormValues = { email: string; password: string; rememberMe: boolean };
type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

const platformHighlights = [
  "Framework assessments and compliance gaps",
  "Evidence, vendors, systems, and dependencies",
  "Audit readiness and workflow approvals",
];

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [values, setValues] = useState<LoginFormValues>({ email: "", password: "", rememberMe: false });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (field: keyof LoginFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = field === "rememberMe" ? event.target.checked : event.target.value;
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setSubmitError("");
  };

  const validate = (): LoginFormErrors => {
    const newErrors: LoginFormErrors = {};
    if (!values.email.trim()) newErrors.email = t("auth.login.errors.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) newErrors.email = t("auth.login.errors.invalidEmail");
    if (!values.password.trim()) newErrors.password = t("auth.login.errors.passwordRequired");
    return newErrors;
  };

  const getRedirectPath = (user: { role: string; mustChangePassword: boolean; onboardingCompleted: boolean }) => {
    if (user.role === "PLATFORM_ADMIN") return "/admin";
    if (user.mustChangePassword) return "/change-password";
    if (!user.onboardingCompleted) return "/onboarding/select-product";
    return "/dashboard";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    try {
      setIsSubmitting(true);
      const user = await login(values.email, values.password, values.rememberMe);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from || getRedirectPath(user), { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("auth.login.errors.loginFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", display: "flex", justifyContent: "center", alignItems: "center", px: { xs: 2, md: 4 }, py: { xs: 5, md: 8 } }}>
      <Box sx={{ width: "100%", maxWidth: 1120, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" }, gap: { xs: 3, md: 5 }, alignItems: "center" }}>
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <Typography variant="overline" color="primary.main" sx={{ fontWeight: 800, letterSpacing: "0.16em" }}>Framework360 secure portal</Typography>
          <Typography variant="h2" sx={{ mt: 1.5, mb: 2, maxWidth: 560, lineHeight: 1.05 }}>Manage compliance with confidence.</Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 560, lineHeight: 1.6, fontWeight: 500 }}>
            Sign in to manage frameworks, evidence, risks, vendors, systems, business processes, and audit readiness in one secure workspace.
          </Typography>
          <Box sx={{ display: "grid", gap: 2, mt: 4 }}>
            {platformHighlights.map((item) => (
              <Box key={item} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <CheckCircleOutlineIcon color="primary" />
                <Typography variant="body1" sx={{ fontWeight: 700 }}>{item}</Typography>
              </Box>
            ))}
          </Box>
          <Paper sx={{ mt: 5, p: 2.5, maxWidth: 520, borderRadius: 4, display: "flex", gap: 2, alignItems: "flex-start", bgcolor: "background.paper" }}>
            <ShieldOutlinedIcon color="primary" sx={{ mt: 0.4 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Built for compliance teams</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Keep requirements, gaps, actions, and proof connected so your organization is better prepared for reviews and audits.
              </Typography>
            </Box>
          </Paper>
        </Box>

        <Paper elevation={3} sx={{ p: { xs: 3, sm: 4, md: 5 }, borderRadius: 6, width: "100%", maxWidth: 520, mx: "auto" }}>
          <Box sx={{ width: 52, height: 52, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "primary.main", color: "primary.contrastText", mb: 3 }}>
            <LockOutlinedIcon />
          </Box>
          <Typography variant="h4" gutterBottom>{t("auth.login.title")}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
            Sign in securely to access your compliance dashboard and manage evidence, risks, frameworks, and audit readiness.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label={t("auth.login.email")} type="email" fullWidth value={values.email} onChange={handleChange("email")} error={!!errors.email} helperText={errors.email} autoComplete="email" />
            <TextField label={t("auth.login.password")} type="password" fullWidth value={values.password} onChange={handleChange("password")} error={!!errors.password} helperText={errors.password} autoComplete="current-password" />

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <FormControlLabel control={<Checkbox checked={values.rememberMe} onChange={handleChange("rememberMe")} />} label={t("auth.login.rememberMe")} />
              <Link component={RouterLink} to="/forgot-password" variant="body2" sx={{ fontWeight: 700 }}>
                Forgot password?
              </Link>
            </Box>

            <Button type="submit" variant="contained" size="large" disabled={isSubmitting} sx={{ mt: 1, minHeight: 48 }}>
              {isSubmitting ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  {t("auth.login.signingIn")}
                </Box>
              ) : "Sign in securely"}
            </Button>

            {submitError && <Alert severity="error">{submitError}</Alert>}

            <Typography variant="body2" sx={{ textAlign: "center", mt: 1 }}>
              {t("auth.login.needAccess")} {" "}
              <Link component={RouterLink} to="/requestdemo">{t("auth.login.requestDemo")}</Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
