import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { updateMyEmail } from "../../api/auth";
import { ApiError } from "../../api/http";
import { useAuth } from "../../context/useAuth";
import { useTranslation } from "react-i18next";
// Settings page for changing the authenticated user's email address.

// Converts API and unknown errors into readable messages.
function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export default function ChangeEmailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  // Stores email change form values.
  const [form, setForm] = useState({
    newEmail: "",
    confirmNewEmail: "",
    currentPassword: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Validates and submits email change request.
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setError(null);
    setMessage(null);

    // Require new email before submitting.
    if (!form.newEmail.trim()) {
      setError(t("settings.errors.newEmailRequired"));
      return;
    }

    // Ensure repeated email matches before submitting.
    if (form.newEmail.trim() !== form.confirmNewEmail.trim()) {
      setError(t("settings.errors.emailsDoNotMatch"));
      return;
    }

    // Require current password to confirm email change.
    if (!form.currentPassword) {
      setError(t("settings.errors.currentPasswordRequired"));
      return;
    }

    setIsSaving(true);

    try {
      await updateMyEmail({
        newEmail: form.newEmail.trim(),
        currentPassword: form.currentPassword,
      });

      // Refresh authenticated user after email change.
      await refreshUser();

      navigate("/settings", {
        state: {
          successMessage: t("settings.emailUpdated"),
        },
      });
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t("settings.changeEmail")}
          </Typography>
          <Typography color="text.secondary">
            {t("settings.emailSubtitle")}
          </Typography>
        </Box>

        {/* Change email form */}
        <Paper sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              {message && <Alert severity="success">{message}</Alert>}

              <TextField
                label={t("settings.currentEmail")}
                type="email"
                value={user?.email ?? ""}
                fullWidth
                disabled
              />

              <TextField
                label={t("settings.newEmail")}
                type="email"
                value={form.newEmail}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    newEmail: event.target.value,
                  }))
                }
                fullWidth
              />

              <TextField
                label={t("settings.confirmNewEmail")}
                type="email"
                value={form.confirmNewEmail}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    confirmNewEmail: event.target.value,
                  }))
                }
                fullWidth
              />

              <TextField
                label={t("settings.currentPassword")}
                type="password"
                value={form.currentPassword}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    currentPassword: event.target.value,
                  }))
                }
                fullWidth
              />

              {/* Form actions */}
              <Stack direction="row" spacing={2}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate("/settings")}
                >
                  {t("common.back")}
                </Button>

                <Button type="submit" variant="contained" disabled={isSaving}>
                  {isSaving ? t("common.loading") : t("settings.changeEmail")}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}
