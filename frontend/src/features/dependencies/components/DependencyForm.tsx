import { useMemo, useState } from "react";
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
  BusinessProcess,
  Dependency,
  DependencyNodeType,
  DependencyPayload,
  DependencyType,
  SystemAsset,
  Vendor,
} from "../../../types/systemRegister";
import { useTranslation } from "react-i18next";
// Form component for creating and editing dependency relationships.

// Props needed to build dependency source and target options.
type DependencyFormProps = {
  initialDependency?: Dependency | null;

  systems: SystemAsset[];
  vendors: Vendor[];
  businessProcesses: BusinessProcess[];

  isSubmitting: boolean;

  onSubmit: (payload: DependencyPayload) => Promise<void>;
  onCancel: () => void;
};

// Local form state before converting values to backend payload.
type FormState = {
  sourceType: DependencyNodeType;
  sourceId: string;

  targetType: DependencyNodeType;
  targetId: string;

  dependencyType: DependencyType;

  isCritical: boolean;

  failureImpact: string;
};

// Converts empty optional text fields to null.
function nullableString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default function DependencyForm({
  initialDependency,
  systems,
  vendors,
  businessProcesses,
  isSubmitting,
  onSubmit,
  onCancel,
}: DependencyFormProps) {
  const [form, setForm] = useState<FormState>(() => ({
    sourceType: initialDependency?.sourceType || "SYSTEM",

    sourceId:
      initialDependency?.sourceId != null
        ? String(initialDependency.sourceId)
        : "",

    targetType: initialDependency?.targetType || "SYSTEM",

    targetId:
      initialDependency?.targetId != null
        ? String(initialDependency.targetId)
        : "",

    dependencyType: initialDependency?.dependencyType || "OTHER",

    isCritical: initialDependency?.isCritical || false,

    failureImpact: initialDependency?.failureImpact || "",
  }));

  const { t } = useTranslation();

  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  // Builds selectable source options based on selected source type.
  const sourceOptions = useMemo(() => {
    if (form.sourceType === "SYSTEM") {
      return systems.map((system) => ({
        id: system.id,
        label: system.name,
      }));
    }

    if (form.sourceType === "VENDOR") {
      return vendors.map((vendor) => ({
        id: vendor.id,
        label: vendor.name,
      }));
    }

    return businessProcesses.map((process) => ({
      id: process.id,
      label: process.name,
    }));
  }, [form.sourceType, systems, vendors, businessProcesses]);

  // Builds selectable target options based on selected target type.
  const targetOptions = useMemo(() => {
    if (form.targetType === "SYSTEM") {
      return systems.map((system) => ({
        id: system.id,
        label: system.name,
      }));
    }

    if (form.targetType === "VENDOR") {
      return vendors.map((vendor) => ({
        id: vendor.id,
        label: vendor.name,
      }));
    }

    return businessProcesses.map((process) => ({
      id: process.id,
      label: process.name,
    }));
  }, [form.targetType, systems, vendors, businessProcesses]);

  // Validates source/target selection and submits normalized dependency payload.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    if (!form.sourceId || !form.targetId) {
      setError(t("dependencies.errors.sourceAndTargetRequired"));
      return;
    }

    const payload: DependencyPayload = {
      sourceType: form.sourceType,
      sourceId: Number(form.sourceId),

      targetType: form.targetType,
      targetId: Number(form.targetId),

      dependencyType: form.dependencyType,

      isCritical: form.isCritical,

      failureImpact: nullableString(form.failureImpact),
    };

    await onSubmit(payload);
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        {initialDependency ? t("dependencies.edit") : t("dependencies.create")}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Dependency source, target and type fields */}
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
        <FormControl fullWidth>
          <InputLabel id="source-type-label">
            {t("dependencies.sourceType")}
          </InputLabel>

          <Select
            labelId="source-type-label"
            label={t("dependencies.sourceType")}
            value={form.sourceType}
            onChange={(event) =>
              updateField(
                "sourceType",
                event.target.value as DependencyNodeType,
              )
            }
          >
            <MenuItem value="SYSTEM">System</MenuItem>

            <MenuItem value="VENDOR">Vendor</MenuItem>

            <MenuItem value="BUSINESS_PROCESS">Business process</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="source-id-label">
            {t("dependencies.source")}
          </InputLabel>

          <Select
            labelId="source-id-label"
            label={t("dependencies.source")}
            value={form.sourceId}
            onChange={(event) => updateField("sourceId", event.target.value)}
          >
            {sourceOptions.map((option) => (
              <MenuItem key={option.id} value={String(option.id)}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="target-type-label">
            {t("dependencies.targetType")}
          </InputLabel>

          <Select
            labelId="target-type-label"
            label={t("dependencies.targetType")}
            value={form.targetType}
            onChange={(event) =>
              updateField(
                "targetType",
                event.target.value as DependencyNodeType,
              )
            }
          >
            <MenuItem value="SYSTEM">System</MenuItem>

            <MenuItem value="VENDOR">Vendor</MenuItem>

            <MenuItem value="BUSINESS_PROCESS">Business process</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="target-id-label">
            {t("dependencies.target")}
          </InputLabel>

          <Select
            labelId="target-id-label"
            label={t("dependencies.target")}
            value={form.targetId}
            onChange={(event) => updateField("targetId", event.target.value)}
          >
            {targetOptions.map((option) => (
              <MenuItem key={option.id} value={String(option.id)}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="dependency-type-label">
            {t("dependencies.dependencyType")}
          </InputLabel>

          <Select
            labelId="dependency-type-label"
            label={t("dependencies.dependencyType")}
            value={form.dependencyType}
            onChange={(event) =>
              updateField(
                "dependencyType",
                event.target.value as DependencyType,
              )
            }
          >
            <MenuItem value="AUTHENTICATION">Authentication</MenuItem>

            <MenuItem value="HOSTING">Hosting</MenuItem>

            <MenuItem value="DATA">Data</MenuItem>

            <MenuItem value="EMAIL">Email</MenuItem>

            <MenuItem value="BACKUP">Backup</MenuItem>

            <MenuItem value="PAYMENT">Payment</MenuItem>

            <MenuItem value="NETWORK">Network</MenuItem>

            <MenuItem value="MANUAL_PROCESS">Manual process</MenuItem>

            <MenuItem value="OTHER">Other</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label={t("dependencies.failureImpact")}
          value={form.failureImpact}
          onChange={(event) => updateField("failureImpact", event.target.value)}
          multiline
          minRows={3}
          fullWidth
        />
      </Box>

      {/* Critical dependency flag */}
      <Box sx={{ mt: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={form.isCritical}
              onChange={(event) =>
                updateField("isCritical", event.target.checked)
              }
            />
          }
          label={t("dependencies.criticalDependency")}
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
