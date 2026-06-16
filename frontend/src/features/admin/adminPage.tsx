import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { activateDemoRequest, getDemoRequests } from "../../api/demoRequest";
import { useTranslation } from "react-i18next";
import type {
  ActivateDemoRequestResponse,
  DemoRequestResponse,
} from "../../types/demoRequest";
import {
  formatDemoRequestStatus,
  formatEmail,
  formatFullName,
} from "../../utils/formatters";
// Admin page for managing and activating demo requests.

export default function AdminPage() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<DemoRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [activationResult, setActivationResult] =
    useState<ActivateDemoRequestResponse | null>(null);

  // Loads all submitted demo requests from backend.
  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await getDemoRequests();
      setRequests(result);
      // Display readable error if request loading fails.
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Could not load demo requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Load demo requests when page mounts.
  useEffect(() => {
    loadRequests();
  }, []);

  // Activates demo request and refreshes request list.
  const handleActivate = async (id: number) => {
    try {
      setActivatingId(id);
      setError("");
      setActivationResult(null);

      const result = await activateDemoRequest(id);
      setActivationResult(result);

      await loadRequests();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Could not activate demo request.",
      );
    } finally {
      setActivatingId(null);
    }
  };

  const copyTemporaryPassword = async () => {
    if (!activationResult?.temporaryPassword) return;
    await navigator.clipboard.writeText(activationResult.temporaryPassword);
  };

  // Show fullscreen loader while requests are loading.
  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t("admin.admin")}
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        {t("admin.subtitle")}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {activationResult && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Stack spacing={1}>
            <Typography variant="body1">
              Demo request activated for{" "}
              <strong>{activationResult.user.email}</strong>.
            </Typography>

            {activationResult.temporaryPassword ? (
              <>
                <Typography variant="body2">
                  Copy this temporary password now and send it to the user. It
                  will not be shown again. Ask the user to change it immediately
                  after first login.
                </Typography>
                <Box
                  component="code"
                  sx={{
                    display: "block",
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: "rgba(255,255,255,0.12)",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}
                >
                  {activationResult.temporaryPassword}
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={copyTemporaryPassword}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Copy password
                </Button>
              </>
            ) : (
              <Typography variant="body2">
                The account is already activated. For security, the original
                temporary password cannot be shown again. Ask the user to use
                Forgot password if needed.
              </Typography>
            )}
          </Stack>
        </Alert>
      )}

      {/* Demo request list */}
      <Stack spacing={2}>
        {requests.map((request) => {
          const canActivate = request.status !== "ACTIVATED";

          return (
            <Paper key={request.id} sx={{ p: 3, borderRadius: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Box>
                  <Typography variant="h6">
                    {formatFullName(request.firstName, request.lastName)}
                  </Typography>
                  <Typography variant="body2">
                    {formatEmail(request.email)}
                  </Typography>
                  <Typography variant="body2">
                    {t("admin.company")} {request.companyName}
                  </Typography>
                  <Typography variant="body2">
                    {t("admin.jobtitle")} {request.jobTitle || "-"}
                  </Typography>
                  <Typography variant="body2">
                    {t("admin.country")} {request.country || "-"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  {/* Request status and activation actions */}
                  <Chip label={formatDemoRequestStatus(request.status)} />
                  <Button
                    variant="contained"
                    disabled={!canActivate || activatingId === request.id}
                    onClick={() => handleActivate(request.id)}
                  >
                    {activatingId === request.id ? "Activating..." : "Activate"}
                  </Button>
                </Box>
              </Box>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
