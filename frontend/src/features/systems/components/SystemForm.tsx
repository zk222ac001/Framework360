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
import type {
  Criticality,
  SystemAsset,
  SystemAssetPayload,
  SystemAssetStatus,
  SystemAssetType,
  Vendor,
} from "../../../types/systemRegister";
import { useTranslation } from "react-i18next";
// Form component used for creating and editing systems/assets.

// Props shared between create and edit system modes.
type SystemFormProps = {
  initialSystem?: SystemAsset | null;
  vendors: Vendor[];
  isSubmitting: boolean;
  onSubmit: (payload: SystemAssetPayload) => Promise<void>;
  onCancel: () => void;
};

// Local editable form state before converting to backend payload.
type FormState = {
  name: string;
  description: string;

  type: SystemAssetType;
  status: SystemAssetStatus;

  criticality: Criticality;

  vendorId: string;

  ownerDepartment: string;

  containsPersonalData: boolean;
  containsSensitiveData: boolean;

  internetExposed: boolean;

  mfaEnabled: boolean;
  backupEnabled: boolean;
  loggingEnabled: boolean;
  monitoringEnabled: boolean;

  rtoMinutes: string;
  rpoMinutes: string;
};

// Converts empty optional text fields to null.
function nullableString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// Converts empty or invalid numeric inputs to null.
function nullableNumber(value: string) {
  if (!value.trim()) return null;

  const parsed = Number(value);

  return Number.isNaN(parsed) ? null : parsed;
}

export default function SystemForm({
  initialSystem,
  vendors,
  isSubmitting,
  onSubmit,
  onCancel,
}: SystemFormProps) {
  // Initialize form with existing system data when editing.
  const [form, setForm] = useState<FormState>(() => ({
    name: initialSystem?.name || "",
    description: initialSystem?.description || "",

    type: initialSystem?.type || "APPLICATION",
    status: initialSystem?.status || "ACTIVE",

    criticality: initialSystem?.criticality || "MEDIUM",

    vendorId: initialSystem?.vendorId ? String(initialSystem.vendorId) : "",

    ownerDepartment: initialSystem?.ownerDepartment || "",

    containsPersonalData: initialSystem?.containsPersonalData || false,
    containsSensitiveData: initialSystem?.containsSensitiveData || false,

    internetExposed: initialSystem?.internetExposed || false,

    mfaEnabled: initialSystem?.mfaEnabled || false,
    backupEnabled: initialSystem?.backupEnabled || false,
    loggingEnabled: initialSystem?.loggingEnabled || false,
    monitoringEnabled: initialSystem?.monitoringEnabled || false,

    rtoMinutes: initialSystem?.rtoMinutes
      ? String(initialSystem.rtoMinutes)
      : "",

    rpoMinutes: initialSystem?.rpoMinutes
      ? String(initialSystem.rpoMinutes)
      : "",
  }));
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  // Updates a single form field while preserving the rest of the state.
  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  // Validates required fields and submits normalized system payload.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    if (!form.name.trim()) {
      setError(t("systems.errors.nameRequired"));
      return;
    }

    // Convert local form state into backend-compatible payload.
    const payload: SystemAssetPayload = {
      name: form.name.trim(),
      description: nullableString(form.description),

      type: form.type,
      status: form.status,
      criticality: form.criticality,

      vendorId: form.vendorId ? Number(form.vendorId) : null,

      ownerDepartment: nullableString(form.ownerDepartment),

      containsPersonalData: form.containsPersonalData,
      containsSensitiveData: form.containsSensitiveData,

      internetExposed: form.internetExposed,

      mfaEnabled: form.mfaEnabled,
      backupEnabled: form.backupEnabled,
      loggingEnabled: form.loggingEnabled,
      monitoringEnabled: form.monitoringEnabled,

      rtoMinutes: nullableNumber(form.rtoMinutes),
      rpoMinutes: nullableNumber(form.rpoMinutes),
    };

    await onSubmit(payload);
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        {initialSystem ? t("systems.edit") : t("systems.create")}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* System details */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "1fr 1fr",
          },
          gap: 2,
        }}
      >
        <TextField
          label={t("systems.systemName")}
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          required
          fullWidth
        />

        <FormControl fullWidth>
          <InputLabel id="system-type-label">
            {t("systems.systemType")}
          </InputLabel>

          <Select
            labelId="system-type-label"
            label={t("systems.systemType")}
            value={form.type}
            onChange={(event) =>
              updateField("type", event.target.value as SystemAssetType)
            }
          >
            <MenuItem value="APPLICATION">Application</MenuItem>

            <MenuItem value="DATABASE">Database</MenuItem>

            <MenuItem value="CLOUD_SERVICE">Cloud service</MenuItem>

            <MenuItem value="SAAS">SaaS</MenuItem>

            <MenuItem value="WEBSITE">Website</MenuItem>

            <MenuItem value="CRM">CRM</MenuItem>

            <MenuItem value="ERP">ERP</MenuItem>

            <MenuItem value="PAYMENT_SYSTEM">Payment system</MenuItem>

            <MenuItem value="OTHER">Other</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="system-status-label">
            {t("systems.status")}
          </InputLabel>

          <Select
            labelId="system-status-label"
            label={t("systems.status")}
            value={form.status}
            onChange={(event) =>
              updateField("status", event.target.value as SystemAssetStatus)
            }
          >
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
            <MenuItem value="PLANNED">Planned</MenuItem>
            <MenuItem value="RETIRED">Retired</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="system-criticality-label">
            {t("systems.criticality")}
          </InputLabel>

          <Select
            labelId="system-criticality-label"
            label={t("systems.criticality")}
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

        <FormControl fullWidth>
          <InputLabel id="system-vendor-label">
            {t("systems.vendor")}
          </InputLabel>

          <Select
            labelId="system-vendor-label"
            label={t("systems.vendor")}
            value={form.vendorId}
            onChange={(event) => updateField("vendorId", event.target.value)}
          >
            <MenuItem value="">No vendor</MenuItem>

            {vendors.map((vendor) => (
              <MenuItem key={vendor.id} value={String(vendor.id)}>
                {vendor.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label={t("systems.ownerDepartment")}
          value={form.ownerDepartment}
          onChange={(event) =>
            updateField("ownerDepartment", event.target.value)
          }
          fullWidth
        />

        <TextField
          label={t("systems.rtoMinutes")}
          type="number"
          value={form.rtoMinutes}
          onChange={(event) => updateField("rtoMinutes", event.target.value)}
          fullWidth
        />

        <TextField
          label={t("systems.rpoMinutes")}
          type="number"
          value={form.rpoMinutes}
          onChange={(event) => updateField("rpoMinutes", event.target.value)}
          fullWidth
        />

        <TextField
          label={t("systems.description")}
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
          multiline
          minRows={3}
          fullWidth
          sx={{
            gridColumn: {
              xs: "auto",
              md: "1 / -1",
            },
          }}
        />
      </Box>

      {/* Security and compliance controls */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          mt: 2,
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              checked={form.containsPersonalData}
              onChange={(event) =>
                updateField("containsPersonalData", event.target.checked)
              }
            />
          }
          label={t("systems.containsPersonalData")}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={form.containsSensitiveData}
              onChange={(event) =>
                updateField("containsSensitiveData", event.target.checked)
              }
            />
          }
          label={t("systems.containsSensitiveData")}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={form.internetExposed}
              onChange={(event) =>
                updateField("internetExposed", event.target.checked)
              }
            />
          }
          label={t("systems.internetExposed")}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={form.mfaEnabled}
              onChange={(event) =>
                updateField("mfaEnabled", event.target.checked)
              }
            />
          }
          label={t("systems.mfaEnabled")}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={form.backupEnabled}
              onChange={(event) =>
                updateField("backupEnabled", event.target.checked)
              }
            />
          }
          label={t("systems.backupEnabled")}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={form.loggingEnabled}
              onChange={(event) =>
                updateField("loggingEnabled", event.target.checked)
              }
            />
          }
          label={t("systems.loggingEnabled")}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={form.monitoringEnabled}
              onChange={(event) =>
                updateField("monitoringEnabled", event.target.checked)
              }
            />
          }
          label={t("systems.monitoringEnabled")}
        />
      </Box>

      {/* Form actions */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 1.5,
          mt: 3,
        }}
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
