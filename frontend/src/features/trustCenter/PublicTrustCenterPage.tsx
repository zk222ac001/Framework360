import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getPublicTrustCenter, type PublicTrustCenter } from "../../api/trustCenter";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 4 }}>
      <Typography variant="h4">{value}</Typography>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
    </Paper>
  );
}

export default function PublicTrustCenterPage() {
  const { slug } = useParams();
  const [trustCenter, setTrustCenter] = useState<PublicTrustCenter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;
    getPublicTrustCenter(slug)
      .then((data) => {
        if (isMounted) setTrustCenter(data);
      })
      .catch((err) => {
        if (isMounted) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (isLoading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!trustCenter) {
    return <Alert severity="info">Trust Center not found.</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 1120, mx: "auto", px: { xs: 2, md: 6 }, py: { xs: 5, md: 8 } }}>
      <Stack spacing={2} sx={{ mb: 5 }}>
        <Chip label="Trust Center" color="primary" sx={{ alignSelf: "flex-start" }} />
        <Typography variant="h1" sx={{ fontSize: { xs: 42, md: 64 }, lineHeight: 1 }}>
          {trustCenter.profile.headline || `${trustCenter.company.name} Trust Center`}
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 820 }}>
          {trustCenter.profile.overview || "Security, privacy, compliance, and audit readiness information."}
        </Typography>
      </Stack>

      <Paper sx={{ p: 3, borderRadius: 5, mb: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" color="text.secondary">Readiness score</Typography>
            <Typography variant="h3">{trustCenter.posture.readinessScore}%</Typography>
            <LinearProgress variant="determinate" value={trustCenter.posture.readinessScore} sx={{ height: 10, borderRadius: 999, mt: 1.5 }} />
          </Box>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            {trustCenter.posture.frameworks.map((framework) => (
              <Chip key={framework} label={framework} />
            ))}
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2, mb: 3 }}>
        <Metric label="Controls tracked" value={trustCenter.posture.controlsTracked} />
        <Metric label="Evidence items" value={trustCenter.posture.evidenceCount} />
        <Metric label="Systems tracked" value={trustCenter.posture.systemsTracked} />
        <Metric label="Vendors tracked" value={trustCenter.posture.vendorsTracked} />
      </Box>

      <Typography variant="h4" sx={{ mb: 2 }}>Shared documents</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
        {trustCenter.documents.map((document) => (
          <Paper key={document.id} sx={{ p: 3, borderRadius: 5 }}>
            <Chip label={document.category} size="small" sx={{ mb: 1.5 }} />
            <Typography variant="h6">{document.title}</Typography>
            <Typography variant="body2" color="text.secondary">{document.description || "Shared compliance document."}</Typography>
          </Paper>
        ))}
        {!trustCenter.documents.length && <Alert severity="info">No public documents have been shared yet.</Alert>}
      </Box>

      {trustCenter.profile.contactEmail && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
          Security contact: {trustCenter.profile.contactEmail}
        </Typography>
      )}
    </Box>
  );
}
