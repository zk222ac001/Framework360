import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { getBusinessProcesses } from "../../api/businessProcesses";
import {
  createDependency,
  deleteDependency,
  getDependencies,
  updateDependency,
} from "../../api/dependencies";
import { getSystems } from "../../api/systems";
import { getVendors } from "../../api/vendors";
import { useAuth } from "../../context/useAuth";
import type {
  BusinessProcess,
  Dependency,
  DependencyNodeType,
  DependencyPayload,
  SystemAsset,
  Vendor,
} from "../../types/systemRegister";
import DependencyForm from "./components/DependencyForm";
import { useTranslation } from "react-i18next";
// Page for managing dependencies between systems, vendors and business processes.

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function formatValue(value?: string | null) {
  if (!value) return "Unknown";

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\w/, (char) => char.toUpperCase());
}

// Finds readable display name for dependency source or target.
function getNodeLabel(
  type: DependencyNodeType,
  id: number,
  systems: SystemAsset[],
  vendors: Vendor[],
  businessProcesses: BusinessProcess[],
) {
  if (type === "SYSTEM") {
    return systems.find((item) => item.id === id)?.name || `System #${id}`;
  }

  if (type === "VENDOR") {
    return vendors.find((item) => item.id === id)?.name || `Vendor #${id}`;
  }

  return (
    businessProcesses.find((item) => item.id === id)?.name ||
    `Business process #${id}`
  );
}

export default function DependenciesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [systems, setSystems] = useState<SystemAsset[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [businessProcesses, setBusinessProcesses] = useState<BusinessProcess[]>(
    [],
  );

  const [selectedDependency, setSelectedDependency] =
    useState<Dependency | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Only admins can create, update and delete dependencies.
  const canWrite =
    user?.role === "CUSTOMER_ADMIN" || user?.role === "PLATFORM_ADMIN";

  // Loads dependencies and related lookup data in parallel.
  async function loadData() {
    setError(null);

    try {
      const [
        dependenciesResponse,
        systemsResponse,
        vendorsResponse,
        businessProcessesResponse,
      ] = await Promise.all([
        getDependencies(),
        getSystems(),
        getVendors(),
        getBusinessProcesses(),
      ]);

      setDependencies(dependenciesResponse.dependencies);
      setSystems(systemsResponse.systems);
      setVendors(vendorsResponse.vendors);
      setBusinessProcesses(businessProcessesResponse.businessProcesses);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function handleCreateClick() {
    setSelectedDependency(null);
    setIsFormOpen(true);
  }

  function handleEditClick(dependency: Dependency) {
    setSelectedDependency(dependency);
    setIsFormOpen(true);
  }

  function handleCancelForm() {
    setSelectedDependency(null);
    setIsFormOpen(false);
  }

  // Creates or updates dependency depending on selected state.
  async function handleSubmit(payload: DependencyPayload) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (selectedDependency) {
        await updateDependency(selectedDependency.id, payload);
      } else {
        await createDependency(payload);
      }

      setSelectedDependency(null);
      setIsFormOpen(false);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirms deletion before removing dependency.
  async function handleDelete(dependency: Dependency) {
    const confirmed = window.confirm(t("dependencies.deleteConfirm"));

    if (!confirmed) return;

    setDeletingId(dependency.id);
    setError(null);

    try {
      await deleteDependency(dependency.id);
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
            {t("dependencies.title")}
          </Typography>
          <Typography color="text.secondary">
            {t("dependencies.subtitle")}
          </Typography>
        </Box>

        {canWrite && (
          <Button variant="contained" onClick={handleCreateClick}>
            {t("dependencies.addDependency")}
          </Button>
        )}
      </Box>

      {!canWrite && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {t("dependencies.readOnly")}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Create/edit dependency form */}
      {isFormOpen && canWrite && (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <DependencyForm
            key={selectedDependency?.id ?? "new-dependency"}
            initialDependency={selectedDependency}
            systems={systems}
            vendors={vendors}
            businessProcesses={businessProcesses}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={handleCancelForm}
          />
        </Paper>
      )}

      {/* Dependency content states */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : dependencies.length === 0 ? (
        <Alert severity="info">{t("dependencies.empty")}</Alert>
      ) : (
        <Box sx={{ display: "grid", gap: 2 }}>
          {dependencies.map((dependency) => {
            const sourceLabel = getNodeLabel(
              dependency.sourceType,
              dependency.sourceId,
              systems,
              vendors,
              businessProcesses,
            );

            const targetLabel = getNodeLabel(
              dependency.targetType,
              dependency.targetId,
              systems,
              vendors,
              businessProcesses,
            );

            return (
              <Paper
                key={dependency.id}
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
                      {sourceLabel} → {targetLabel}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {formatValue(dependency.sourceType)} depends on{" "}
                      {formatValue(dependency.targetType)}
                    </Typography>
                  </Box>

                  {canWrite && (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleEditClick(dependency)}
                      >
                        Edit
                      </Button>

                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        disabled={deletingId === dependency.id}
                        onClick={() => handleDelete(dependency)}
                      >
                        {deletingId === dependency.id
                          ? "Deleting..."
                          : "Delete"}
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* Dependency metadata */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
                  <Chip
                    label={formatValue(dependency.dependencyType)}
                    color="primary"
                    size="small"
                  />

                  {dependency.isCritical && (
                    <Chip
                      label="Critical dependency"
                      color="error"
                      size="small"
                    />
                  )}

                  <Chip
                    label={`Source: ${formatValue(dependency.sourceType)}`}
                    variant="outlined"
                    size="small"
                  />

                  <Chip
                    label={`Target: ${formatValue(dependency.targetType)}`}
                    variant="outlined"
                    size="small"
                  />
                </Box>

                {dependency.failureImpact && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography color="text.secondary">
                      {dependency.failureImpact}
                    </Typography>
                  </>
                )}
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
