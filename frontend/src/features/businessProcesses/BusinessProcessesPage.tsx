import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import {
  createBusinessProcess,
  deleteBusinessProcess,
  getBusinessProcesses,
  updateBusinessProcess,
} from "../../api/businessProcesses";
import { useAuth } from "../../context/useAuth";
import type {
  BusinessProcess,
  BusinessProcessPayload,
  Criticality,
} from "../../types/systemRegister";
import BusinessProcessForm from "./components/BusinessProcessForm";
import { useTranslation } from "react-i18next";
// Page for listing, creating, editing and deleting business processes.

// Converts unknown errors into readable messages.
function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

// Formats enum-like values for display.
function formatValue(value?: string | null) {
  if (!value) return "Unknown";

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\w/, (char) => char.toUpperCase());
}

// Maps process criticality to MUI chip colors.
function getCriticalityColor(
  value?: Criticality,
): "default" | "success" | "warning" | "error" {
  if (value === "LOW") return "success";
  if (value === "HIGH") return "warning";
  if (value === "CRITICAL") return "error";
  return "default";
}

// Converts downtime minutes into a readable duration.
function formatDowntime(minutes?: number | null) {
  if (minutes == null) return "Not set";
  if (minutes < 60) return `${minutes} min`;

  const hours = minutes / 60;

  if (Number.isInteger(hours)) return `${hours} hours`;

  return `${hours.toFixed(1)} hours`;
}

export default function BusinessProcessesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [businessProcesses, setBusinessProcesses] = useState<BusinessProcess[]>(
    [],
  );
  const [selectedBusinessProcess, setSelectedBusinessProcess] =
    useState<BusinessProcess | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Only admins can create, update and delete business processes.
  const canWrite =
    user?.role === "CUSTOMER_ADMIN" || user?.role === "PLATFORM_ADMIN";

  // Loads business processes from backend.
  async function loadBusinessProcesses() {
    setError(null);

    try {
      const response = await getBusinessProcesses();
      setBusinessProcesses(response.businessProcesses);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  // Load business processes when page mounts.
  useEffect(() => {
    void loadBusinessProcesses();
  }, []);

  // Opens empty form for creating a new process.
  function handleCreateClick() {
    setSelectedBusinessProcess(null);
    setIsFormOpen(true);
  }

  // Opens form with selected process for editing.
  function handleEditClick(businessProcess: BusinessProcess) {
    setSelectedBusinessProcess(businessProcess);
    setIsFormOpen(true);
  }

  // Closes form and clears selected process.
  function handleCancelForm() {
    setSelectedBusinessProcess(null);
    setIsFormOpen(false);
  }

  // Creates or updates process depending on selected state.
  async function handleSubmit(payload: BusinessProcessPayload) {
    setIsSubmitting(true);
    setError(null);

    try {
      // Existing process means edit mode, otherwise create mode.
      if (selectedBusinessProcess) {
        await updateBusinessProcess(selectedBusinessProcess.id, payload);
      } else {
        await createBusinessProcess(payload);
      }

      setSelectedBusinessProcess(null);
      setIsFormOpen(false);
      await loadBusinessProcesses();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirms deletion before removing process.
  async function handleDelete(businessProcess: BusinessProcess) {
    const confirmed = window.confirm(
      t("processes.deleteConfirm", { name: businessProcess.name }),
    );

    if (!confirmed) return;

    setDeletingId(businessProcess.id);
    setError(null);

    try {
      await deleteBusinessProcess(businessProcess.id);
      await loadBusinessProcesses();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
          mb: 4,
        }}
      >
        {/* Page header and create action */}
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
            {t("processes.title")}
          </Typography>
          <Typography color="text.secondary">
            {t("processes.subtitle")}
          </Typography>
        </Box>

        {canWrite && (
          <Button variant="contained" onClick={handleCreateClick}>
            {t("processes.addProcess")}
          </Button>
        )}
      </Box>

      {/* Read-only notice for users without write access */}
      {!canWrite && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {t("processes.readOnly")}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Create/edit form */}
      {isFormOpen && canWrite && (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <BusinessProcessForm
            key={selectedBusinessProcess?.id ?? "new-business-process"}
            initialBusinessProcess={selectedBusinessProcess}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={handleCancelForm}
          />
        </Paper>
      )}

      {/* Business process content states */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : businessProcesses.length === 0 ? (
        <Alert severity="info">{t("processes.empty")}</Alert>
      ) : (
        <Box sx={{ display: "grid", gap: 2 }}>
          {/* Business process cards */}
          {businessProcesses.map((businessProcess) => (
            <Paper
              key={businessProcess.id}
              elevation={2}
              sx={{ p: 3, borderRadius: 3 }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {businessProcess.name}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Owner department:{" "}
                    {businessProcess.ownerDepartment || "No owner department"}
                  </Typography>
                </Box>

                {canWrite && (
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleEditClick(businessProcess)}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      disabled={deletingId === businessProcess.id}
                      onClick={() => handleDelete(businessProcess)}
                    >
                      {deletingId === businessProcess.id
                        ? "Deleting..."
                        : "Delete"}
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Process metadata */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
                <Chip
                  label={formatValue(businessProcess.criticality)}
                  color={getCriticalityColor(businessProcess.criticality)}
                  size="small"
                />

                <Chip
                  label={`Max downtime: ${formatDowntime(
                    businessProcess.maxTolerableDowntimeMinutes,
                  )}`}
                  variant="outlined"
                  size="small"
                />

                <Chip
                  label={
                    businessProcess.manualWorkaroundAvailable
                      ? "Manual workaround: yes"
                      : "Manual workaround: no"
                  }
                  variant="outlined"
                  size="small"
                />
              </Box>

              {businessProcess.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography color="text.secondary">
                    {businessProcess.description}
                  </Typography>
                </>
              )}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
