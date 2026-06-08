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
  createSystem,
  deleteSystem,
  getSystems,
  updateSystem,
} from "../../api/systems";
import { getVendors } from "../../api/vendors";
import { useAuth } from "../../context/useAuth";
import type {
  Criticality,
  SystemAsset,
  SystemAssetPayload,
  Vendor,
} from "../../types/systemRegister";
import SystemForm from "./components/SystemForm";
import { useTranslation } from "react-i18next";
// Page for managing company systems and technical assets.

// Converts unknown errors into readable messages.
function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

// Formats enum-like values into readable labels.
function formatValue(value?: string | null) {
  if (!value) return "Unknown";

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\w/, (char) => char.toUpperCase());
}

// Maps system criticality to MUI chip colors.
function getCriticalityColor(
  value?: Criticality,
): "default" | "success" | "warning" | "error" {
  if (value === "LOW") return "success";
  if (value === "HIGH") return "warning";
  if (value === "CRITICAL") return "error";
  return "default";
}

export default function SystemsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [systems, setSystems] = useState<SystemAsset[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<SystemAsset | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Only admins can create, update and delete systems.
  const canWrite =
    user?.role === "CUSTOMER_ADMIN" || user?.role === "PLATFORM_ADMIN";

  // Loads systems and vendors in parallel.
  async function loadData() {
    setError(null);

    try {
      const [systemsResponse, vendorsResponse] = await Promise.all([
        getSystems(),
        getVendors(),
      ]);

      setSystems(systemsResponse.systems);
      setVendors(vendorsResponse.vendors);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  // Load systems and vendor references when page mounts.
  useEffect(() => {
    void loadData();
  }, []);

  // Opens empty form for creating a new system.
  function handleCreateClick() {
    setSelectedSystem(null);
    setIsFormOpen(true);
  }

  // Opens form with selected system data.
  function handleEditClick(system: SystemAsset) {
    setSelectedSystem(system);
    setIsFormOpen(true);
  }

  // Closes form and clears selected system.
  function handleCancelForm() {
    setSelectedSystem(null);
    setIsFormOpen(false);
  }

  // Creates or updates system depending on selected state.
  async function handleSubmit(payload: SystemAssetPayload) {
    setIsSubmitting(true);
    setError(null);

    try {
      // Existing system means edit mode, otherwise create mode.
      if (selectedSystem) {
        await updateSystem(selectedSystem.id, payload);
      } else {
        await createSystem(payload);
      }

      setSelectedSystem(null);
      setIsFormOpen(false);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirms deletion before removing system.
  async function handleDelete(system: SystemAsset) {
    const confirmed = window.confirm(
      t("systems.deleteConfirm", { name: system.name }),
    );

    if (!confirmed) return;

    setDeletingId(system.id);
    setError(null);

    try {
      await deleteSystem(system.id);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", p: 3 }}>
      {/* Page header and create action */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
            {t("systems.title")}
          </Typography>
          <Typography color="text.secondary">
            {t("systems.subtitle")}
          </Typography>
        </Box>

        {canWrite && (
          <Button variant="contained" onClick={handleCreateClick}>
            {t("systems.addSystem")}
          </Button>
        )}
      </Box>

      {/* Read-only notice for users without write access */}
      {!canWrite && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {t("systems.readOnly")}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Create/edit system form */}
      {isFormOpen && canWrite && (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <SystemForm
            key={selectedSystem?.id ?? "new-system"}
            initialSystem={selectedSystem}
            vendors={vendors}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={handleCancelForm}
          />
        </Paper>
      )}

      {/* System content states */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : systems.length === 0 ? (
        <Alert severity="info">{t("systems.empty")}</Alert>
      ) : (
        <Box sx={{ display: "grid", gap: 2 }}>
          {/* System cards */}
          {systems.map((system) => (
            <Paper key={system.id} elevation={2} sx={{ p: 3, borderRadius: 3 }}>
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
                    {system.name}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {formatValue(system.type)} · {formatValue(system.status)} ·{" "}
                    Vendor: {system.vendor?.name || "No vendor"} · Owner:{" "}
                    {system.ownerDepartment || "No owner department"}
                  </Typography>
                </Box>

                {canWrite && (
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleEditClick(system)}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      disabled={deletingId === system.id}
                      onClick={() => handleDelete(system)}
                    >
                      {deletingId === system.id ? "Deleting..." : "Delete"}
                    </Button>
                  </Box>
                )}
              </Box>

              {/* System metadata and security controls */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
                <Chip
                  label={formatValue(system.criticality)}
                  color={getCriticalityColor(system.criticality)}
                  size="small"
                />

                {system.containsPersonalData && (
                  <Chip label="Personal data" color="primary" size="small" />
                )}

                {system.containsSensitiveData && (
                  <Chip label="Sensitive data" color="warning" size="small" />
                )}

                {system.internetExposed && (
                  <Chip label="Internet exposed" color="error" size="small" />
                )}

                <Chip
                  label={system.mfaEnabled ? "MFA: yes" : "MFA: no"}
                  variant="outlined"
                  size="small"
                />

                <Chip
                  label={system.backupEnabled ? "Backup: yes" : "Backup: no"}
                  variant="outlined"
                  size="small"
                />

                <Chip
                  label={system.loggingEnabled ? "Logging: yes" : "Logging: no"}
                  variant="outlined"
                  size="small"
                />

                <Chip
                  label={
                    system.monitoringEnabled
                      ? "Monitoring: yes"
                      : "Monitoring: no"
                  }
                  variant="outlined"
                  size="small"
                />

                <Chip
                  label={`RTO: ${system.rtoMinutes ?? "not set"} min`}
                  variant="outlined"
                  size="small"
                />

                <Chip
                  label={`RPO: ${system.rpoMinutes ?? "not set"} min`}
                  variant="outlined"
                  size="small"
                />
              </Box>

              {/* Optional system description */}
              {system.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography color="text.secondary">
                    {system.description}
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
