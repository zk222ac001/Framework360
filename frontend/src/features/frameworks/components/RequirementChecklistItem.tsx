import { useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import type {
  FrameworkRequirement,
  RequirementAnswerStatus,
} from "../../../types/framework";
import { getEvidenceFileUrl } from "../../../api/frameworks";
import { useTranslation } from "react-i18next";
// Requirement card used for answering, noting and uploading evidence.

// Requirement answer state and callbacks controlled by parent assessment page.
type Props = {
  requirement: FrameworkRequirement;
  value: RequirementAnswerStatus;
  note: string;
  onChange: (status: RequirementAnswerStatus) => void;
  onNoteChange: (note: string) => void;
  onEvidenceUpload?: (
    requirement: FrameworkRequirement,
    file: File,
  ) => Promise<void>;
  onEvidenceDelete?: (evidenceId: number) => Promise<void>;
};

// Resolves evidence file name with fallbacks.
function evidenceName(file: {
  originalName?: string | null;
  filename?: string | null;
  filePath?: string | null;
}) {
  return (
    file.originalName ||
    file.filename ||
    file.filePath?.split("/").pop() ||
    "Evidence file"
  );
}

export default function RequirementChecklistItem({
  requirement,
  value,
  note,
  onChange,
  onNoteChange,
  onEvidenceUpload,
  onEvidenceDelete,
}: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  // Normalize evidence to an array before rendering.
  const evidence = Array.isArray(requirement.answer?.evidence)
    ? requirement.answer.evidence
    : [];
  const hasEvidence = evidence.length > 0;
  const [deletingEvidenceId, setDeletingEvidenceId] = useState<number | null>(
    null,
  );
  // Answer options shown as selectable requirement statuses.
  const answerOptions: Array<{
    value: RequirementAnswerStatus;
    label: string;
  }> = [
    { value: "YES", label: t("frameworksPage.requirement.yes") },
    { value: "PARTIAL", label: t("frameworksPage.requirement.partial") },
    { value: "NO", label: t("frameworksPage.requirement.no") },
    {
      value: "NOT_APPLICABLE",
      label: t("frameworksPage.requirement.notApplicable"),
    },
  ];

  // Uploads selected evidence file for the requirement.
  async function handleFileChange(file?: File) {
    if (!file || !onEvidenceUpload) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      await onEvidenceUpload(requirement, file);
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : t("frameworksPage.requirement.errors.uploadFailed"),
      );
    } finally {
      setIsUploading(false);
    }
  }

  // Deletes selected evidence file from the requirement.
  async function handleDeleteEvidence(evidenceId: number) {
    if (!onEvidenceDelete) return;

    setDeletingEvidenceId(evidenceId);
    setUploadError(null);

    try {
      await onEvidenceDelete(evidenceId);
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : t("frameworksPage.requirement.errors.deleteFailed"),
      );
    } finally {
      setDeletingEvidenceId(null);
    }
  }

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
      {/* Requirement title, reference and evidence status */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", mb: 1 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          {requirement.question}
        </Typography>
        {requirement.reference && (
          <Chip label={requirement.reference} size="small" />
        )}
        <Chip
          label={
            hasEvidence
              ? t("frameworksPage.requirement.evidenceAdded")
              : t("frameworksPage.requirement.missingEvidence")
          }
          color={hasEvidence ? "success" : "default"}
          size="small"
          variant={hasEvidence ? "filled" : "outlined"}
        />
      </Box>

      {requirement.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {requirement.description}
        </Typography>
      )}

      {/* Guidance, example evidence and risk information */}
      {(requirement.implementationGuide ||
        requirement.exampleEvidence ||
        requirement.riskIfMissing) && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
          <Stack spacing={1.5}>
            {requirement.implementationGuide && (
              <Box>
                <Typography variant="subtitle2">
                  {t("frameworksPage.requirement.howToFix")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {requirement.implementationGuide}
                </Typography>
              </Box>
            )}
            {requirement.exampleEvidence && (
              <Box>
                <Typography variant="subtitle2">
                  {t("frameworksPage.requirement.exampleEvidence")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {requirement.exampleEvidence}
                </Typography>
              </Box>
            )}
            {requirement.riskIfMissing && (
              <Box>
                <Typography variant="subtitle2">
                  {t("frameworksPage.requirement.riskIfMissing")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {requirement.riskIfMissing}
                </Typography>
              </Box>
            )}
          </Stack>
        </Paper>
      )}

      {/* Requirement answer options */}
      <ToggleButtonGroup
        exclusive
        value={value === "UNANSWERED" ? null : value}
        onChange={(_, nextValue: RequirementAnswerStatus | null) => {
          if (nextValue) onChange(nextValue);
        }}
        sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}
      >
        {answerOptions.map((option) => (
          <ToggleButton
            key={option.value}
            value={option.value}
            sx={{ borderRadius: 2 }}
          >
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/* Optional assessor note */}
      <TextField
        fullWidth
        multiline
        minRows={2}
        label={t("frameworksPage.requirement.optionalNote")}
        value={note}
        onChange={(event) => onNoteChange(event.target.value)}
      />

      <Divider sx={{ my: 2 }} />

      {/* Evidence files and upload action */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography variant="subtitle2">
            {t("frameworksPage.requirement.evidence")}
          </Typography>
          {evidence.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t("frameworksPage.requirement.noEvidence")}
            </Typography>
          ) : (
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
              {evidence.map((file) => (
                <Chip
                  key={file.id}
                  label={evidenceName(file)}
                  size="small"
                  variant="outlined"
                  component="a"
                  href={getEvidenceFileUrl(file.id)}
                  target={
                    file.fileType === "application/pdf" ? "_blank" : undefined
                  }
                  rel="noreferrer"
                  clickable
                  onDelete={
                    onEvidenceDelete
                      ? (event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          void handleDeleteEvidence(file.id);
                        }
                      : undefined
                  }
                  disabled={deletingEvidenceId === file.id}
                />
              ))}
            </Stack>
          )}
        </Box>

        <Box>
          <input
            hidden
            ref={inputRef}
            type="file"
            onChange={(event) => handleFileChange(event.target.files?.[0])}
          />
          <Button
            variant="outlined"
            disabled={isUploading || !onEvidenceUpload}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading
              ? t("frameworksPage.requirement.uploading")
              : t("frameworksPage.requirement.uploadEvidence")}
          </Button>
        </Box>
      </Box>

      {uploadError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {uploadError}
        </Alert>
      )}
    </Paper>
  );
}
