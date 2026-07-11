import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  createTrustCenterDocument,
  deleteTrustCenterDocument,
  getTrustCenter,
  updateTrustCenterDocument,
  updateTrustCenterProfile,
  type TrustCenterDocument,
  type TrustCenterEvidenceOption,
  type TrustCenterProfile,
} from "../../api/trustCenter";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

const categories = ["SECURITY", "PRIVACY", "COMPLIANCE", "REPORT", "POLICY", "OTHER"];

export default function TrustCenterPage() {
  const [profile, setProfile] = useState<TrustCenterProfile | null>(null);
  const [documents, setDocuments] = useState<TrustCenterDocument[]>([]);
  const [evidence, setEvidence] = useState<TrustCenterEvidenceOption[]>([]);
  const [docForm, setDocForm] = useState({ title: "", category: "SECURITY", description: "", evidenceId: "", isPublic: true });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadData() {
    setError(null);
    try {
      const data = await getTrustCenter();
      setProfile(data.profile);
      setDocuments(data.documents);
      setEvidence(data.evidence);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSaveProfile() {
    if (!profile) return;

    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      const response = await updateTrustCenterProfile({
        isPublished: profile.isPublished,
        slug: profile.slug,
        headline: profile.headline,
        overview: profile.overview,
        contactEmail: profile.contactEmail,
        publishedSections: profile.publishedSections,
      });
      setProfile(response.profile);
      setNotice("Trust Center profile saved.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateDocument() {
    if (!docForm.title.trim()) return;

    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      await createTrustCenterDocument({
        title: docForm.title.trim(),
        category: docForm.category,
        description: docForm.description || null,
        evidenceId: docForm.evidenceId || null,
        isPublic: docForm.isPublic,
      });
      setDocForm({ title: "", category: "SECURITY", description: "", evidenceId: "", isPublic: true });
      setNotice("Trust Center document added.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleDocument(document: TrustCenterDocument) {
    setError(null);
    try {
      await updateTrustCenterDocument(document.id, { isPublic: !document.isPublic });
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDeleteDocument(document: TrustCenterDocument) {
    if (!window.confirm(`Delete ${document.title}?`)) return;

    setError(null);
    try {
      await deleteTrustCenterDocument(document.id);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (isLoading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;
  }

  if (!profile) {
    return <Alert severity="info">No Trust Center profile available.</Alert>;
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 1180, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 2, md: 4 } }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Chip label="Trust Center" color="primary" sx={{ alignSelf: "flex-start" }} />
        <Typography variant="h4">Publish customer-facing trust content</Typography>
        <Typography color="text.secondary">
          Share your compliance posture, public evidence summaries, policies, and reports from one controlled profile.
        </Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}

      <Paper sx={{ p: 3, borderRadius: 5, mb: 3 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label="Slug" value={profile.slug} onChange={(event) => setProfile({ ...profile, slug: event.target.value })} helperText={`Public URL: /trust/${profile.slug}`} fullWidth />
            <TextField label="Contact email" value={profile.contactEmail || ""} onChange={(event) => setProfile({ ...profile, contactEmail: event.target.value })} fullWidth />
          </Stack>
          <TextField label="Headline" value={profile.headline || ""} onChange={(event) => setProfile({ ...profile, headline: event.target.value })} fullWidth />
          <TextField label="Overview" value={profile.overview || ""} onChange={(event) => setProfile({ ...profile, overview: event.target.value })} multiline minRows={3} fullWidth />
          <FormControlLabel
            control={<Switch checked={profile.isPublished} onChange={(event) => setProfile({ ...profile, isPublished: event.target.checked })} />}
            label="Published"
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="contained" disabled={isSaving} onClick={handleSaveProfile}>Save profile</Button>
            <Button variant="outlined" href={`/trust/${profile.slug}`} target="_blank">Open public page</Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 5, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Add public document</Typography>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
          <TextField label="Title" value={docForm.title} onChange={(event) => setDocForm({ ...docForm, title: event.target.value })} fullWidth />
          <TextField select label="Category" value={docForm.category} onChange={(event) => setDocForm({ ...docForm, category: event.target.value })} sx={{ minWidth: 170 }}>
            {categories.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
          </TextField>
          <TextField select label="Linked evidence" value={docForm.evidenceId} onChange={(event) => setDocForm({ ...docForm, evidenceId: event.target.value })} sx={{ minWidth: 240 }}>
            <MenuItem value="">No evidence link</MenuItem>
            {evidence.map((item) => <MenuItem key={item.id} value={item.id}>{item.title}</MenuItem>)}
          </TextField>
          <Button variant="contained" disabled={!docForm.title.trim() || isSaving} onClick={handleCreateDocument}>Add</Button>
        </Stack>
        <TextField label="Description" value={docForm.description} onChange={(event) => setDocForm({ ...docForm, description: event.target.value })} multiline minRows={2} fullWidth sx={{ mt: 2 }} />
      </Paper>

      <Stack spacing={2}>
        {documents.map((document) => (
          <Paper key={document.id} sx={{ p: 2.5, borderRadius: 4 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                  <Typography variant="h6">{document.title}</Typography>
                  <Chip label={document.category} size="small" />
                  <Chip label={document.isPublic ? "Public" : "Private"} color={document.isPublic ? "success" : "default"} size="small" />
                </Stack>
                <Typography variant="body2" color="text.secondary">{document.description || "No description"}</Typography>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button variant="outlined" onClick={() => handleToggleDocument(document)}>{document.isPublic ? "Make private" : "Publish"}</Button>
                <Button variant="outlined" color="error" onClick={() => handleDeleteDocument(document)}>Delete</Button>
              </Stack>
            </Stack>
          </Paper>
        ))}
        {!documents.length && <Alert severity="info">No Trust Center documents yet.</Alert>}
      </Stack>
    </Box>
  );
}
