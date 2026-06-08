import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { updateMyProfile } from "../../api/auth";
import { getMyCompany, updateMyCompany } from "../../api/company";
import { ApiError } from "../../api/http";
import { useAuth } from "../../context/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
// Account settings page for profile, email, password and company details.

// Sector options available for company settings.
const sectorOptions = [
  "FINANCE",
  "BANKING",
  "INSURANCE",
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
];

// Converts API and unknown errors into readable messages.
function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export default function AccountSettingsPage() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
  });
  const [companyForm, setCompanyForm] = useState({
    name: "",
    cvr: "",
    sector: "",
    country: "",
  });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [companyMessage, setCompanyMessage] = useState<string | null>(null);
  const [globalSuccessMessage] = useState<string | null>(
    (location.state as { successMessage?: string } | null)?.successMessage ??
      null,
  );
  const [profileError, setProfileError] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  // Only admins can edit company information.
  const canEditCompany =
    user?.role === "CUSTOMER_ADMIN" || user?.role === "PLATFORM_ADMIN";

  // Keep profile form synchronized with authenticated user data.
  useEffect(() => {
    setProfileForm({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
    });
  }, [user]);

  // Load company settings when page mounts.
  useEffect(() => {
    let isMounted = true;

    async function loadCompany() {
      try {
        setIsLoadingCompany(true);
        const data = await getMyCompany();

        if (!isMounted) return;

        setCompanyForm({
          name: data.name ?? "",
          cvr: data.cvr ?? "",
          sector: data.sector ?? "",
          country: data.country ?? "",
        });
      } catch (error) {
        if (isMounted) {
          setCompanyError(getErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsLoadingCompany(false);
        }
      }
    }
    void loadCompany();
    return () => {
      isMounted = false;
    };
  }, []);

  // Saves updated profile details.
  async function handleProfileSubmit(event: React.FormEvent) {
    event.preventDefault();
    setProfileError(null);
    setProfileMessage(null);
    setIsSavingProfile(true);

    try {
      await updateMyProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
      });
      await refreshUser();
      setProfileMessage(t("settings.profileUpdated"));
    } catch (error) {
      setProfileError(getErrorMessage(error));
    } finally {
      setIsSavingProfile(false);
    }
  }

  // Saves updated company details.
  async function handleCompanySubmit(event: React.FormEvent) {
    event.preventDefault();
    setCompanyError(null);
    setCompanyMessage(null);
    setIsSavingCompany(true);

    try {
      await updateMyCompany({
        name: companyForm.name,
        cvr: companyForm.cvr || null,
        sector: companyForm.sector || null,
        country: companyForm.country || null,
      });
      await refreshUser();
      setCompanyMessage(t("settings.companyUpdated"));
    } catch (error) {
      setCompanyError(getErrorMessage(error));
    } finally {
      setIsSavingCompany(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", p: 3 }}>
      <Stack spacing={3}>
        {/* Success message passed from related settings pages */}
        {globalSuccessMessage && (
          <Alert severity="success">{globalSuccessMessage}</Alert>
        )}
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t("settings.title")}
          </Typography>
          <Typography color="text.secondary">
            {t("settings.subtitle")}
          </Typography>
        </Box>

        {/* Profile settings */}
        <Paper sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleProfileSubmit}>
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t("settings.profile")}
              </Typography>

              {profileError && <Alert severity="error">{profileError}</Alert>}
              {profileMessage && (
                <Alert severity="success">{profileMessage}</Alert>
              )}

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label={t("settings.firstName")}
                  value={profileForm.firstName}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      firstName: event.target.value,
                    }))
                  }
                  fullWidth
                />

                <TextField
                  label={t("settings.lastName")}
                  value={profileForm.lastName}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      lastName: event.target.value,
                    }))
                  }
                  fullWidth
                />
              </Stack>

              <Box>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSavingProfile}
                >
                  {isSavingProfile
                    ? t("common.loading")
                    : t("settings.saveProfile")}
                </Button>
              </Box>
            </Stack>
          </Box>
        </Paper>

        {/* Email settings */}
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t("settings.email")}
            </Typography>

            <TextField
              label={t("settings.currentEmail")}
              type="email"
              value={user?.email ?? ""}
              fullWidth
              disabled
            />

            <Box>
              <Button
                variant="contained"
                onClick={() => navigate("/settings/change-email")}
              >
                {t("settings.changeEmail")}
              </Button>
            </Box>
          </Stack>
        </Paper>

        {/* Password settings */}
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t("settings.password")}
            </Typography>

            <Typography color="text.secondary">
              {t("settings.passwordSubtitle")}
            </Typography>

            <Box>
              <Button
                variant="contained"
                onClick={() => navigate("/settings/change-password")}
              >
                {t("settings.changePassword")}
              </Button>
            </Box>
          </Stack>
        </Paper>

        {/* Company settings */}
        <Paper sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleCompanySubmit}>
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t("settings.company")}
              </Typography>

              {isLoadingCompany && <CircularProgress size={24} />}

              {companyError && <Alert severity="error">{companyError}</Alert>}
              {companyMessage && (
                <Alert severity="success">{companyMessage}</Alert>
              )}

              {!canEditCompany && (
                <Alert severity="info">{t("settings.companyReadOnly")}</Alert>
              )}

              <TextField
                label={t("settings.companyName")}
                value={companyForm.name}
                onChange={(event) =>
                  setCompanyForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                fullWidth
                disabled={!canEditCompany}
              />

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label={t("settings.cvr")}
                  value={companyForm.cvr}
                  onChange={(event) =>
                    setCompanyForm((current) => ({
                      ...current,
                      cvr: event.target.value,
                    }))
                  }
                  fullWidth
                  disabled={!canEditCompany}
                />

                <TextField
                  label={t("settings.country")}
                  value={companyForm.country}
                  onChange={(event) =>
                    setCompanyForm((current) => ({
                      ...current,
                      country: event.target.value,
                    }))
                  }
                  fullWidth
                  disabled={!canEditCompany}
                />
              </Stack>

              <TextField
                label={t("settings.sector")}
                value={companyForm.sector}
                onChange={(event) =>
                  setCompanyForm((current) => ({
                    ...current,
                    sector: event.target.value,
                  }))
                }
                select
                fullWidth
                disabled={!canEditCompany}
              >
                <MenuItem value="">None</MenuItem>
                {sectorOptions.map((sector) => (
                  <MenuItem key={sector} value={sector}>
                    {sector}
                  </MenuItem>
                ))}
              </TextField>

              <Divider />

              {canEditCompany && (
                <Box>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSavingCompany}
                  >
                    {isSavingCompany
                      ? t("common.loading")
                      : t("settings.saveCompany")}
                  </Button>
                </Box>
              )}
            </Stack>
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}
