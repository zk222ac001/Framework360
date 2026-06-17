import { useEffect, useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  activateDemoRequest,
  deleteDemoRequest,
  getDemoRequests,
  updateDemoRequest,
} from "../../api/demoRequest";
import { useTranslation } from "react-i18next";
import type {
  ActivateDemoRequestResponse,
  DemoRequestFormValues,
  DemoRequestResponse,
} from "../../types/demoRequest";
import {
  formatDemoRequestStatus,
  formatEmail,
  formatFullName,
} from "../../utils/formatters";
import { isCompanyEmail } from "../../utils/companyEmail";
// Admin page for managing and activating demo requests.

type DemoRequestFormErrors = Partial<Record<keyof DemoRequestFormValues, string>>;

const emptyEditValues: DemoRequestFormValues = {
  email: "",
  firstName: "",
  lastName: "",
  companyName: "",
  jobTitle: "",
  country: "",
};

export default function AdminPage() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<DemoRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingRequest, setEditingRequest] =
    useState<DemoRequestResponse | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<DemoRequestResponse | null>(null);
  const [editValues, setEditValues] =
    useState<DemoRequestFormValues>(emptyEditValues);
  const [editErrors, setEditErrors] = useState<DemoRequestFormErrors>({});
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

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // Activates demo request and refreshes request list.
  const handleActivate = async (id: number) => {
    try {
      setActivatingId(id);
      clearMessages();
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

  const openEditDialog = (request: DemoRequestResponse) => {
    clearMessages();
    setActivationResult(null);
    setEditingRequest(request);
    setEditValues({
      email: request.email,
      firstName: request.firstName,
      lastName: request.lastName,
      companyName: request.companyName,
      jobTitle: request.jobTitle || "",
      country: request.country || "",
    });
    setEditErrors({});
  };

  const closeEditDialog = () => {
    if (savingId) return;
    setEditingRequest(null);
    setEditValues(emptyEditValues);
    setEditErrors({});
  };

  const handleEditChange =
    (field: keyof DemoRequestFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      setEditValues((prev) => ({
        ...prev,
        [field]: value,
      }));

      if (editErrors[field]) {
        setEditErrors((prev) => ({
          ...prev,
          [field]: "",
        }));
      }
    };

  const validateEdit = () => {
    const newErrors: DemoRequestFormErrors = {};

    if (!editValues.email.trim()) {
      newErrors.email = t("auth.requestDemo.errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editValues.email)) {
      newErrors.email = t("auth.requestDemo.errors.invalidEmail");
    } else if (!isCompanyEmail(editValues.email)) {
      newErrors.email = t("auth.requestDemo.errors.companyEmailRequired");
    }

    if (!editValues.firstName.trim()) {
      newErrors.firstName = t("auth.requestDemo.errors.firstNameRequired");
    }

    if (!editValues.lastName.trim()) {
      newErrors.lastName = t("auth.requestDemo.errors.lastNameRequired");
    }

    if (!editValues.companyName.trim()) {
      newErrors.companyName = t("auth.requestDemo.errors.companyNameRequired");
    }

    return newErrors;
  };

  const handleSaveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingRequest) return;

    const validationErrors = validateEdit();
    setEditErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    try {
      setSavingId(editingRequest.id);
      clearMessages();
      setActivationResult(null);

      await updateDemoRequest(editingRequest.id, editValues);
      setSuccess(t("admin.updateSuccess"));
      closeEditDialog();
      await loadRequests();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Could not update demo request.",
      );
    } finally {
      setSavingId(null);
    }
  };

  const openDeleteDialog = (request: DemoRequestResponse) => {
    clearMessages();
    setActivationResult(null);
    setDeleteTarget(request);
  };

  const closeDeleteDialog = () => {
    if (deletingId) return;
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeletingId(deleteTarget.id);
      clearMessages();
      setActivationResult(null);

      await deleteDemoRequest(deleteTarget.id);
      setSuccess(t("admin.deleteSuccess"));
      setDeleteTarget(null);
      await loadRequests();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Could not delete demo request.",
      );
    } finally {
      setDeletingId(null);
    }
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

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
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
        {requests.length === 0 && (
          <Typography variant="body2">{t("admin.empty")}</Typography>
        )}

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

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center", flexWrap: "wrap" }}
                >
                  {/* Request status and management actions */}
                  <Chip label={formatDemoRequestStatus(request.status)} />
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => openEditDialog(request)}
                  >
                    {t("common.edit")}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    disabled={deletingId === request.id}
                    onClick={() => openDeleteDialog(request)}
                  >
                    {t("common.delete")}
                  </Button>
                  <Button
                    variant="contained"
                    disabled={!canActivate || activatingId === request.id}
                    onClick={() => handleActivate(request.id)}
                  >
                    {activatingId === request.id ? "Activating..." : "Activate"}
                  </Button>
                </Stack>
              </Box>
            </Paper>
          );
        })}
      </Stack>

      <Dialog
        open={Boolean(editingRequest)}
        onClose={closeEditDialog}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={handleSaveEdit} noValidate>
          <DialogTitle>{t("admin.editRequest")}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label={t("auth.requestDemo.email")}
                type="email"
                value={editValues.email}
                onChange={handleEditChange("email")}
                error={!!editErrors.email}
                helperText={editErrors.email}
                fullWidth
              />
              <TextField
                label={t("auth.requestDemo.firstName")}
                value={editValues.firstName}
                onChange={handleEditChange("firstName")}
                error={!!editErrors.firstName}
                helperText={editErrors.firstName}
                fullWidth
              />
              <TextField
                label={t("auth.requestDemo.lastName")}
                value={editValues.lastName}
                onChange={handleEditChange("lastName")}
                error={!!editErrors.lastName}
                helperText={editErrors.lastName}
                fullWidth
              />
              <TextField
                label={t("auth.requestDemo.companyName")}
                value={editValues.companyName}
                onChange={handleEditChange("companyName")}
                error={!!editErrors.companyName}
                helperText={editErrors.companyName}
                fullWidth
              />
              <TextField
                label={t("auth.requestDemo.jobTitle")}
                value={editValues.jobTitle}
                onChange={handleEditChange("jobTitle")}
                fullWidth
              />
              <TextField
                label={t("auth.requestDemo.country")}
                value={editValues.country}
                onChange={handleEditChange("country")}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditDialog} disabled={!!savingId}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!!savingId}
              startIcon={<EditIcon />}
            >
              {savingId ? t("admin.saving") : t("admin.saveChanges")}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={closeDeleteDialog}>
        <DialogTitle>{t("admin.deleteDialogTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("admin.deleteDialogBody", {
              name: deleteTarget
                ? formatFullName(deleteTarget.firstName, deleteTarget.lastName)
                : "",
              email: deleteTarget ? formatEmail(deleteTarget.email) : "",
            })}
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, fontWeight: 700 }}>
            {t("admin.deleteWarning")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={!!deletingId}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={!!deletingId}
            onClick={handleConfirmDelete}
          >
            {deletingId ? t("admin.deleting") : t("admin.deleteUser")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
