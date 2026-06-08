import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getEvidenceOverview } from "../../api/evidence";
import { getEvidenceFileUrl } from "../../api/frameworks";
import type { EvidenceFile } from "../../types/framework";
import { formatFrameworkCode } from "../../utils/formatters";
import { useTranslation } from "react-i18next";
// Page showing uploaded evidence files across assessments.

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

// Formats file size into readable units.
function formatFileSize(
  size: number | null | undefined,
  t: (key: string) => string,
) {
  if (!size) return t("evidence.unknownSize");

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

// Formats upload date based on selected language.
function formatDate(value: string | null | undefined, language: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat(language === "da" ? "da-DK" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

// Resolves uploader display name with fallbacks.
function getUploaderName(evidence: EvidenceFile, t: (key: string) => string) {
  const uploader = evidence.uploadedBy;

  if (!uploader) return t("evidence.unknownUser");

  const fullName =
    `${uploader.firstName || ""} ${uploader.lastName || ""}`.trim();

  return fullName || uploader.email || t("evidence.unknownUser");
}

export default function EvidenceOverviewPage() {
  const { t, i18n } = useTranslation();
  const [evidence, setEvidence] = useState<EvidenceFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Loads evidence overview when page mounts.
  useEffect(() => {
    let isMounted = true;

    getEvidenceOverview()
      .then((data) => {
        if (!isMounted) return;

        // Supports backend returning evidence as a direct array.
        if (Array.isArray(data)) {
          setEvidence(data);
          return;
        }

        // Supports backend returning evidence inside an evidence property.
        if (
          data &&
          typeof data === "object" &&
          "evidence" in data &&
          Array.isArray(data.evidence)
        ) {
          setEvidence(data.evidence);
          return;
        }

        // Supports backend returning evidence inside an items property.
        if (
          data &&
          typeof data === "object" &&
          "items" in data &&
          Array.isArray(data.items)
        ) {
          setEvidence(data.items);
          return;
        }

        setEvidence([]);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
          {t("evidence.title")}
        </Typography>
        <Typography color="text.secondary">{t("evidence.subtitle")}</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Evidence content states */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : evidence.length === 0 ? (
        <Alert severity="info">{t("evidence.empty")}</Alert>
      ) : (
        <Stack spacing={2}>
          {evidence.map((item) => {
            const fileUrl = getEvidenceFileUrl(item.id);
            const fileName =
              item.originalName ||
              item.filename ||
              `${t("evidence.evidenceFile")} #${item.id}`;

            return (
              <Paper key={item.id} elevation={2} sx={{ p: 3, borderRadius: 3 }}>
                <Stack spacing={2}>
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
                        {fileName}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        {t("evidence.uploadedBy")} {getUploaderName(item, t)} ·{" "}
                        {formatDate(item.createdAt, i18n.language)} ·{" "}
                        {formatFileSize(item.size, t)}
                      </Typography>
                    </Box>

                    {/* File actions */}
                    <Stack direction="row" spacing={1}>
                      <Button
                        component="a"
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        variant="outlined"
                        size="small"
                      >
                        {t("evidence.openFile")}
                      </Button>

                      <Button
                        component="a"
                        href={fileUrl}
                        download
                        variant="contained"
                        size="small"
                      >
                        {t("evidence.download")}
                      </Button>
                    </Stack>
                  </Box>

                  {/* Evidence metadata */}
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {item.framework?.code && (
                      <Chip
                        label={formatFrameworkCode(item.framework.code)}
                        color="primary"
                        size="small"
                      />
                    )}

                    {item.section?.title && (
                      <Chip
                        label={item.section.title}
                        variant="outlined"
                        size="small"
                      />
                    )}

                    {item.fileType && (
                      <Chip
                        label={item.fileType}
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Box>

                  {/* Linked requirement */}
                  {item.requirement?.question && (
                    <>
                      <Divider />
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 700 }}
                        >
                          {t("evidence.requirement")}
                        </Typography>
                        <Typography sx={{ mt: 0.5 }}>
                          {item.requirement.question}
                        </Typography>
                      </Box>
                    </>
                  )}

                  {item.description && (
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 700 }}
                      >
                        {t("evidence.description")}
                      </Typography>
                      <Typography sx={{ mt: 0.5 }}>
                        {item.description}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
