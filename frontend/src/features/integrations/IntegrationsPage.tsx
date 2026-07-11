import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  disconnectIntegration,
  getIntegrations,
  saveIntegration,
  testIntegration,
  type IntegrationProvider,
} from "../../api/integrations";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function statusColor(status?: string): "success" | "warning" | "error" | "default" {
  if (status === "CONNECTED") return "success";
  if (status === "ERROR") return "error";
  if (status === "DISCONNECTED") return "warning";
  return "default";
}

export default function IntegrationsPage() {
  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [busyProvider, setBusyProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadData() {
    setError(null);
    try {
      const data = await getIntegrations();
      setProviders(data.providers);
      const nextDrafts: Record<string, Record<string, string>> = {};
      data.providers.forEach((provider) => {
        nextDrafts[provider.id] = {};
        provider.requiredFields.forEach((field) => {
          const value = provider.connection?.config?.[field];
          nextDrafts[provider.id][field] = typeof value === "string" ? value : "";
        });
      });
      setDrafts(nextDrafts);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function updateDraft(provider: string, field: string, value: string) {
    setDrafts((current) => ({
      ...current,
      [provider]: {
        ...(current[provider] || {}),
        [field]: value,
      },
    }));
  }

  async function handleSave(provider: IntegrationProvider) {
    setBusyProvider(provider.id);
    setError(null);
    setNotice(null);
    try {
      const response = await saveIntegration(provider.id, {
        displayName: provider.name,
        authType: provider.authType,
        config: drafts[provider.id] || {},
      });
      setNotice(`${response.connection.displayName} saved.`);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyProvider(null);
    }
  }

  async function handleTest(provider: IntegrationProvider) {
    setBusyProvider(provider.id);
    setError(null);
    setNotice(null);
    try {
      const response = await testIntegration(provider.id);
      setNotice(response.message);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyProvider(null);
    }
  }

  async function handleDisconnect(provider: IntegrationProvider) {
    setBusyProvider(provider.id);
    setError(null);
    setNotice(null);
    try {
      await disconnectIntegration(provider.id);
      setNotice(`${provider.name} disconnected.`);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyProvider(null);
    }
  }

  if (isLoading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 1240, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 2, md: 4 } }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Chip label="Integrations" color="primary" sx={{ alignSelf: "flex-start" }} />
        <Typography variant="h4">Connect evidence sources</Typography>
        <Typography color="text.secondary">
          Register provider connections for Microsoft 365, Google Workspace, GitHub, AWS, Azure, and Jira. Evidence jobs use these connections to collect audit snapshots.
        </Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 2.5 }}>
        {providers.map((provider) => (
          <Paper key={provider.id} sx={{ p: 3, borderRadius: 5, minWidth: 0 }}>
            <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
              <Box>
                <Typography variant="h6">{provider.name}</Typography>
                <Typography variant="body2" color="text.secondary">{provider.category}</Typography>
              </Box>
              <Chip
                label={provider.connection?.status || "NOT CONNECTED"}
                color={statusColor(provider.connection?.status)}
                size="small"
              />
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {provider.authType}
            </Typography>

            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mb: 2 }}>
              {provider.evidenceTypes.map((type) => (
                <Chip key={type} label={type} size="small" variant="outlined" />
              ))}
            </Stack>

            <Stack spacing={1.5}>
              {provider.requiredFields.map((field) => (
                <TextField
                  key={field}
                  label={field}
                  value={drafts[provider.id]?.[field] || ""}
                  onChange={(event) => updateDraft(provider.id, field, event.target.value)}
                  size="small"
                  fullWidth
                />
              ))}
            </Stack>

            {provider.connection?.lastSyncMessage && (
              <Alert severity={provider.connection.status === "ERROR" ? "warning" : "info"} sx={{ mt: 2 }}>
                {provider.connection.lastSyncMessage}
              </Alert>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2 }}>
              <Button variant="contained" disabled={busyProvider === provider.id} onClick={() => handleSave(provider)}>
                Save connection
              </Button>
              <Button variant="outlined" disabled={!provider.connection || busyProvider === provider.id} onClick={() => handleTest(provider)}>
                Test
              </Button>
              <Button color="error" variant="outlined" disabled={!provider.connection || busyProvider === provider.id} onClick={() => handleDisconnect(provider)}>
                Disconnect
              </Button>
            </Stack>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
