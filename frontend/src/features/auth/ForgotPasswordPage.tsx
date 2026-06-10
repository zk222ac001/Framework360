import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link as RouterLink } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import { forgotPassword } from "../../api/auth";

type FormValues = { email: string };
type FormErrors = Partial<Record<keyof FormValues, string>>;

export default function ForgotPasswordPage() {
  const [values, setValues] = useState<FormValues>({ email: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValues({ email: event.target.value });
    setErrors({});
    setSubmitError("");
    setSubmitSuccess("");
    setResetToken("");
  };

  const validate = () => {
    const newErrors: FormErrors = {};
    if (!values.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      newErrors.email = "Enter a valid email address";
    }
    return newErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      setIsSubmitting(true);
      const response = await forgotPassword({ email: values.email });
      setSubmitSuccess(response.message);
      setResetToken(response.resetToken || "");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not request password reset");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 76px)", display: "grid", placeItems: "center", p: 2 }}>
      <Paper sx={{ width: "100%", maxWidth: 520, p: { xs: 3, sm: 4 }, borderRadius: 5 }}>
        <Box sx={{ width: 52, height: 52, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "primary.main", color: "primary.contrastText", mb: 3 }}>
          <LockResetOutlinedIcon />
        </Box>

        <Typography variant="h4" gutterBottom>Forgot password?</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
          Enter your account email and Framework360 will prepare a secure password reset link.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Email address" type="email" value={values.email} onChange={handleChange} error={!!errors.email} helperText={errors.email} fullWidth autoComplete="email" />

          <Button type="submit" variant="contained" size="large" disabled={isSubmitting} sx={{ minHeight: 48 }}>
            {isSubmitting ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                Sending reset instructions
              </Box>
            ) : (
              "Send reset instructions"
            )}
          </Button>

          {submitSuccess && <Alert severity="success">{submitSuccess}</Alert>}
          {resetToken && (
            <Alert severity="info">
              Development reset link: <Link component={RouterLink} to={`/reset-password?token=${resetToken}`}>Reset password now</Link>
            </Alert>
          )}
          {submitError && <Alert severity="error">{submitError}</Alert>}

          <Typography variant="body2" sx={{ textAlign: "center", mt: 1 }}>
            Remembered your password? <Link component={RouterLink} to="/login">Back to login</Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
