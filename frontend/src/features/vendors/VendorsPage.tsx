import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import {
  createVendor,
  deleteVendor,
  getVendors,
  updateVendor,
} from "../../api/vendors";
import { useAuth } from "../../context/useAuth";
import type {
  Criticality,
  Vendor,
  VendorPayload,
} from "../../types/systemRegister";
import VendorForm from "./components/VendorForm";
// Page for managing third-party vendors and suppliers.

// Converts unknown errors into readable messages.
function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

// Formats criticality values into readable labels.
function formatCriticality(value?: Criticality | string) {
  if (!value) return "Unknown";
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\w/, (char) => char.toUpperCase());
}

// Maps vendor criticality to MUI chip colors.
function getCriticalityColor(
  value?: Criticality,
): "default" | "success" | "warning" | "error" {
  if (value === "LOW") return "success";
  if (value === "HIGH") return "warning";
  if (value === "CRITICAL") return "error";
  return "default";
}

// Formats review date for display.
function formatDate(value?: string | null) {
  if (!value) return "No review date";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default function VendorsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Only admins can create, update and delete vendors.
  const canWrite =
    user?.role === "CUSTOMER_ADMIN" || user?.role === "PLATFORM_ADMIN";

  // Loads vendor data from backend.
  async function loadVendors() {
    setError(null);

    try {
      const response = await getVendors();
      setVendors(response.vendors);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  // Load vendors when page mounts.
  useEffect(() => {
    void loadVendors();
  }, []);

  // Opens empty form for creating a new vendor.
  function handleCreateClick() {
    setSelectedVendor(null);
    setIsFormOpen(true);
  }

  // Opens form with selected vendor data.
  function handleEditClick(vendor: Vendor) {
    setSelectedVendor(vendor);
    setIsFormOpen(true);
  }

  // Closes form and clears selected vendor.
  function handleCancelForm() {
    setSelectedVendor(null);
    setIsFormOpen(false);
  }

  // Creates or updates vendor depending on selected state.
  async function handleSubmit(payload: VendorPayload) {
    setIsSubmitting(true);
    setError(null);

    try {
      // Existing vendor means edit mode, otherwise create mode.
      if (selectedVendor) {
        await updateVendor(selectedVendor.id, payload);
      } else {
        await createVendor(payload);
      }

      setSelectedVendor(null);
      setIsFormOpen(false);
      await loadVendors();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirms deletion before removing vendor.
  async function handleDelete(vendor: Vendor) {
    const confirmed = window.confirm(
      t("vendors.deleteConfirm", { name: vendor.name }),
    );

    if (!confirmed) return;

    setDeletingId(vendor.id);
    setError(null);

    try {
      await deleteVendor(vendor.id);
      await loadVendors();
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
            {t("vendors.title")}
          </Typography>
          <Typography color="text.secondary">
            {t("vendors.subtitle")}
          </Typography>
        </Box>

        {canWrite && (
          <Button variant="contained" onClick={handleCreateClick}>
            {t("vendors.addVendor")}
          </Button>
        )}
      </Box>

      {/* Read-only notice for users without write access */}
      {!canWrite && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {t("vendors.readOnly")}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Create/edit vendor form */}
      {isFormOpen && canWrite && (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <VendorForm
            key={selectedVendor?.id ?? "new-vendor"}
            initialVendor={selectedVendor}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={handleCancelForm}
          />
        </Paper>
      )}

      {/* Vendor content states */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : vendors.length === 0 ? (
        <Alert severity="info">{t("vendors.empty")}</Alert>
      ) : (
        <Box sx={{ display: "grid", gap: 2 }}>
          {/* Vendor cards */}
          {vendors.map((vendor) => (
            <Paper key={vendor.id} elevation={2} sx={{ p: 3, borderRadius: 3 }}>
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
                    {vendor.name}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {vendor.website || "No website"} ·{" "}
                    {vendor.contactEmail || "No contact email"} ·{" "}
                    {vendor.country || "No country"}
                  </Typography>
                </Box>

                {canWrite && (
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleEditClick(vendor)}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      disabled={deletingId === vendor.id}
                      onClick={() => handleDelete(vendor)}
                    >
                      {deletingId === vendor.id ? "Deleting..." : "Delete"}
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Vendor compliance and risk metadata */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
                <Chip
                  label={formatCriticality(vendor.criticality)}
                  color={getCriticalityColor(vendor.criticality)}
                  size="small"
                />

                {vendor.isCriticalSupplier && (
                  <Chip label="Critical supplier" color="error" size="small" />
                )}

                <Chip
                  label={vendor.hasDpa ? "DPA: yes" : "DPA: no"}
                  variant="outlined"
                  size="small"
                />

                <Chip
                  label={vendor.hasSla ? "SLA: yes" : "SLA: no"}
                  variant="outlined"
                  size="small"
                />

                <Chip
                  label={
                    vendor.hasSecurityReview
                      ? "Security review: yes"
                      : "Security review: no"
                  }
                  variant="outlined"
                  size="small"
                />

                <Chip
                  label={`Review: ${formatDate(vendor.reviewDate)}`}
                  variant="outlined"
                  size="small"
                />
              </Box>

              {/* Optional vendor description */}
              {vendor.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography color="text.secondary">
                    {vendor.description}
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
