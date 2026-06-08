import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import type {
  Criticality,
  Vendor,
  VendorPayload,
} from "../../../types/systemRegister";
// Form component used for creating and editing vendors.

// Props shared between create and edit vendor modes.
type VendorFormProps = {
  initialVendor?: Vendor | null;
  isSubmitting: boolean;
  onSubmit: (payload: VendorPayload) => Promise<void>;
  onCancel: () => void;
};

// Local editable vendor form state.
type FormState = {
  name: string;
  description: string;
  website: string;
  contactEmail: string;
  criticality: Criticality;
  isCriticalSupplier: boolean;
  hasDpa: boolean;
  hasSla: boolean;
  hasSecurityReview: boolean;
  country: string;
  reviewDate: string;
};

// Converts ISO date into browser date input format.
function toDateInputValue(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

// Converts empty optional text fields to null.
function toNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// Converts browser date input into ISO string for backend.
function toReviewDate(value: string) {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

export default function VendorForm({
  initialVendor,
  isSubmitting,
  onSubmit,
  onCancel,
}: VendorFormProps) {
  // Initialize form with existing vendor data when editing.
  const [form, setForm] = useState<FormState>(() => ({
    name: initialVendor?.name || "",
    description: initialVendor?.description || "",
    website: initialVendor?.website || "",
    contactEmail: initialVendor?.contactEmail || "",
    criticality: initialVendor?.criticality || "MEDIUM",
    isCriticalSupplier: initialVendor?.isCriticalSupplier || false,
    hasDpa: initialVendor?.hasDpa || false,
    hasSla: initialVendor?.hasSla || false,
    hasSecurityReview: initialVendor?.hasSecurityReview || false,
    country: initialVendor?.country || "",
    reviewDate: toDateInputValue(initialVendor?.reviewDate),
  }));
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  // Updates a single form field while preserving form state.
  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  // Validates required fields and submits normalized vendor payload.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError(t("vendors.errors.nameRequired"));
      return;
    }

    // Convert local form state into backend-compatible payload.
    const payload: VendorPayload = {
      name: form.name.trim(),
      description: toNullableString(form.description),
      website: toNullableString(form.website),
      contactEmail: toNullableString(form.contactEmail),
      criticality: form.criticality,
      isCriticalSupplier: form.isCriticalSupplier,
      hasDpa: form.hasDpa,
      hasSla: form.hasSla,
      hasSecurityReview: form.hasSecurityReview,
      country: toNullableString(form.country),
      reviewDate: toReviewDate(form.reviewDate),
    };

    await onSubmit(payload);
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        {initialVendor ? t("vendors.edit") : t("vendors.create")}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Vendor details */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
        }}
      >
        <TextField
          label={t("vendors.vendorName")}
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          required
          fullWidth
        />

        <TextField
          label={t("vendors.website")}
          value={form.website}
          onChange={(event) => updateField("website", event.target.value)}
          fullWidth
        />

        <TextField
          label={t("vendors.contactEmail")}
          value={form.contactEmail}
          onChange={(event) => updateField("contactEmail", event.target.value)}
          fullWidth
        />

        <TextField
          label={t("vendors.country")}
          value={form.country}
          onChange={(event) => updateField("country", event.target.value)}
          fullWidth
        />

        <FormControl fullWidth>
          <InputLabel id="vendor-criticality-label">
            {t("vendors.criticality")}
          </InputLabel>
          <Select
            labelId="vendor-criticality-label"
            label={t("vendors.criticality")}
            value={form.criticality}
            onChange={(event) =>
              updateField("criticality", event.target.value as Criticality)
            }
          >
            <MenuItem value="LOW">Low</MenuItem>
            <MenuItem value="MEDIUM">Medium</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
            <MenuItem value="CRITICAL">Critical</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label={t("vendors.reviewDate")}
          type="date"
          value={form.reviewDate}
          onChange={(event) => updateField("reviewDate", event.target.value)}
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
          fullWidth
        />

        <TextField
          label={t("vendors.description")}
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
          multiline
          minRows={3}
          fullWidth
          sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}
        />
      </Box>

      {/* Vendor compliance and risk controls */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={form.isCriticalSupplier}
              onChange={(event) =>
                updateField("isCriticalSupplier", event.target.checked)
              }
            />
          }
          label={t("vendors.criticalSupplier")}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={form.hasDpa}
              onChange={(event) => updateField("hasDpa", event.target.checked)}
            />
          }
          label={t("vendors.hasDpa")}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={form.hasSla}
              onChange={(event) => updateField("hasSla", event.target.checked)}
            />
          }
          label={t("vendors.hasSla")}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={form.hasSecurityReview}
              onChange={(event) =>
                updateField("hasSecurityReview", event.target.checked)
              }
            />
          }
          label={t("vendors.hasSecurityReview")}
        />
      </Box>

      {/* Form actions */}
      <Box
        sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 3 }}
      >
        <Button onClick={onCancel} disabled={isSubmitting}>
          {t("common.cancel")}
        </Button>

        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? t("common.loading") : t("common.save")}
        </Button>
      </Box>
    </Box>
  );
}
