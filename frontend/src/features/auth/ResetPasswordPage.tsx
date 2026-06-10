import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { resetPassword } from "../../api/auth";

type FormValues = { newPassword: string; confirmPassword: string };
type FormErrors = Partial<Record<keyof FormValues, string>>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [values, setValues] = useState<FormValues>({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange =
    (field: keyof FormValues) => (event: ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
      setSubmitError("");
      setSubmitSuccess("");
    };

  const validate = () => {
    const newErrors: FormErrors = {};
    if (!values.newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (values.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }
    if (!values.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm the new password";
    } else if (values.newPassword !== values.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    return newErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!token) {
      setSubmitError("Reset token is missing. Please request a new password reset link.");
      return;
    }

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      setIsSubmitting(true);
      await resetPassword({ token, newPassword: values.newPassword });
      setSubmitSuccess("Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", display: "grid", placeItems: "center", p: 2 }}>
      <Paper sx={{ width: "100%", maxWidth: 520, p: { xs: 3, sm: 4 }, borderRadius: 5 }}>
        <Box sx={{ width: 52, height: 52, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "primary.main", color: "primary.contrastText", mb: 3 }}>
          <LockOutlinedIcon />
        </Box>

        <Typography variant="h4" gutterBottom>Reset password</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
          Create a new secure password for your Framework360 account.
        </Typography>

        {!token && <Alert severity="warning" sx={{ mb: 2 }}>Reset token is missing. Please request a new password reset link.</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="New password" type="password" value={values.newPassword} onChange={handleChange("newPassword")} error={!!errors.newPassword} helperText={errors.newPassword} fullWidth autoComplete="new-password" />
          <TextField label="Confirm new password" type="password" value={values.confirmPassword} onChange={handleChange("confirmPassword")} error={!!errors.confirmPassword} helperText={errors.confirmPassword} fullWidth autoComplete="new-password" />

          <Button type="submit" variant="contained" size="large" disabled={isSubmitting || !token} sx={{ minHeight: 48 }}>
            {isSubmitting ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                Resetting password
              </Box>
            ) : (
              "Reset password"
            )}
          </Button>

          {submitSuccess && <Alert severity="success">{submitSuccess}</Alert>}
          {submitError && <Alert severity="error">{submitError}</Alert>}

          <Typography variant="body2" sx={{ textAlign: "center", mt: 1 }}>
            <Link component={RouterLink} to="/forgot-password">Request a new reset link</Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
