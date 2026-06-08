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
  BusinessProcess,
  BusinessProcessPayload,
  Criticality,
} from "../../../types/systemRegister";
import { useTranslation } from "react-i18next";
// Form component used for creating and editing business processes.

// Props shared between create and edit mode.
type BusinessProcessFormProps = {
  initialBusinessProcess?: BusinessProcess | null;
  isSubmitting: boolean;
  onSubmit: (payload: BusinessProcessPayload) => Promise<void>;
  onCancel: () => void;
};

// Local form state used before converting values to backend payload.
type FormState = {
  name: string;
  description: string;
  ownerDepartment: string;
  criticality: Criticality;
  maxTolerableDowntimeMinutes: string;
  manualWorkaroundAvailable: boolean;
};

// Converts empty text inputs to null before sending to backend.
function nullableString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// Converts empty or invalid number inputs to null before sending to backend.
function nullableNumber(value: string) {
  if (!value.trim()) return null;

  const parsed = Number(value);

  return Number.isNaN(parsed) ? null : parsed;
}

export default function BusinessProcessForm({
  initialBusinessProcess,
  isSubmitting,
  onSubmit,
  onCancel,
}: BusinessProcessFormProps) {
  // Initialize form values from existing process when editing.
  const [form, setForm] = useState<FormState>(() => ({
    name: initialBusinessProcess?.name || "",
    description: initialBusinessProcess?.description || "",
    ownerDepartment: initialBusinessProcess?.ownerDepartment || "",
    criticality: initialBusinessProcess?.criticality || "MEDIUM",
    maxTolerableDowntimeMinutes:
      initialBusinessProcess?.maxTolerableDowntimeMinutes != null
        ? String(initialBusinessProcess.maxTolerableDowntimeMinutes)
        : "",
    manualWorkaroundAvailable:
      initialBusinessProcess?.manualWorkaroundAvailable || false,
  }));
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  // Updates a single form field while preserving the rest of the form state.
  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  // Validates required fields and submits normalized payload.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    if (!form.name.trim()) {
      setError(t("processes.errors.nameRequired"));
      return;
    }

    // Convert form state into backend-compatible payload.
    const payload: BusinessProcessPayload = {
      name: form.name.trim(),
      description: nullableString(form.description),
      ownerDepartment: nullableString(form.ownerDepartment),
      criticality: form.criticality,
      maxTolerableDowntimeMinutes: nullableNumber(
        form.maxTolerableDowntimeMinutes,
      ),
      manualWorkaroundAvailable: form.manualWorkaroundAvailable,
    };

    await onSubmit(payload);
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        {initialBusinessProcess ? t("processes.edit") : t("processes.create")}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Business process details */}
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
          label={t("processes.processName")}
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          required
          fullWidth
        />

        <TextField
          label={t("processes.ownerDepartment")}
          value={form.ownerDepartment}
          onChange={(event) =>
            updateField("ownerDepartment", event.target.value)
          }
          fullWidth
        />

        <FormControl fullWidth>
          <InputLabel id="business-process-criticality-label">
            {t("processes.criticality")}
          </InputLabel>

          <Select
            labelId="business-process-criticality-label"
            label={t("processes.criticality")}
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
          label={t("processes.maxTolerableDowntimeMinutes")}
          type="number"
          value={form.maxTolerableDowntimeMinutes}
          onChange={(event) =>
            updateField("maxTolerableDowntimeMinutes", event.target.value)
          }
          fullWidth
        />

        <TextField
          label={t("processes.description")}
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

      {/* Recovery and continuity options */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={form.manualWorkaroundAvailable}
              onChange={(event) =>
                updateField("manualWorkaroundAvailable", event.target.checked)
              }
            />
          }
          label={t("processes.manualWorkaroundAvailable")}
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
