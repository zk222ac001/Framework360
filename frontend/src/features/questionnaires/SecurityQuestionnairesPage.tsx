import { useCallback, useEffect, useState } from "react";
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
  createQuestionnaire,
  deleteQuestionnaire,
  generateQuestionnaireAnswers,
  getQuestionnaires,
  updateQuestionnaireQuestion,
  type SecurityQuestionnaire,
} from "../../api/questionnaires";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function statusColor(status: string): "success" | "warning" | "default" {
  if (status === "APPROVED" || status === "REVIEWED") return "success";
  if (status === "GENERATED") return "warning";
  return "default";
}

export default function SecurityQuestionnairesPage() {
  const [questionnaires, setQuestionnaires] = useState<SecurityQuestionnaire[]>([]);
  const [selected, setSelected] = useState<SecurityQuestionnaire | null>(null);
  const [form, setForm] = useState({
    title: "",
    requester: "",
    questions: "Do you enforce MFA?\nDo you have an incident response policy?\nHow do you review vendors?",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const data = await getQuestionnaires();
      setQuestionnaires(data.questionnaires);
      setSelected((current) =>
        current
          ? data.questionnaires.find((item) => item.id === current.id) || null
          : data.questionnaires[0] || null
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleCreate() {
    const questions = form.questions
      .split("\n")
      .map((question) => question.trim())
      .filter(Boolean);

    if (!form.title.trim() || !questions.length) return;

    setBusyId("new");
    setError(null);
    setNotice(null);
    try {
      const response = await createQuestionnaire({
        title: form.title.trim(),
        requester: form.requester || null,
        questions,
      });
      setForm({ title: "", requester: "", questions: "" });
      setSelected(response.questionnaire);
      setNotice("Questionnaire created.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleGenerate(questionnaire: SecurityQuestionnaire) {
    setBusyId(questionnaire.id);
    setError(null);
    setNotice(null);
    try {
      const response = await generateQuestionnaireAnswers(questionnaire.id);
      setSelected(response.questionnaire);
      setNotice("Answers generated from workspace data.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkReviewed(questionnaire: SecurityQuestionnaire, questionId: string) {
    setBusyId(questionId);
    setError(null);
    try {
      await updateQuestionnaireQuestion(questionnaire.id, questionId, { status: "REVIEWED" });
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(questionnaire: SecurityQuestionnaire) {
    if (!window.confirm(`Delete ${questionnaire.title}?`)) return;

    setBusyId(questionnaire.id);
    setError(null);
    try {
      await deleteQuestionnaire(questionnaire.id);
      setSelected(null);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 1240, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 2, md: 4 } }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Chip label="Questionnaire automation" color="primary" sx={{ alignSelf: "flex-start" }} />
        <Typography variant="h4">Generate security questionnaire answers</Typography>
        <Typography color="text.secondary">
          Paste customer security questions and generate draft answers from controls, evidence, systems, vendors, policies, and Trust Center data.
        </Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }}>{notice}</Alert>}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "0.85fr 1.15fr" }, gap: 3 }}>
        <Stack spacing={2}>
          <Paper sx={{ p: 3, borderRadius: 5 }}>
            <Typography variant="h6" gutterBottom>New questionnaire</Typography>
            <Stack spacing={2}>
              <TextField label="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} fullWidth />
              <TextField label="Requester" value={form.requester} onChange={(event) => setForm({ ...form, requester: event.target.value })} fullWidth />
              <TextField label="Questions, one per line" value={form.questions} onChange={(event) => setForm({ ...form, questions: event.target.value })} multiline minRows={8} fullWidth />
              <Button variant="contained" disabled={!form.title.trim() || !form.questions.trim() || busyId === "new"} onClick={handleCreate}>
                Create questionnaire
              </Button>
            </Stack>
          </Paper>

          {questionnaires.map((questionnaire) => (
            <Paper key={questionnaire.id} onClick={() => setSelected(questionnaire)} sx={{ p: 2.5, borderRadius: 4, cursor: "pointer", border: "1px solid", borderColor: selected?.id === questionnaire.id ? "primary.main" : "divider" }}>
              <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{questionnaire.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{questionnaire.answeredQuestions}/{questionnaire.totalQuestions} answered</Typography>
                </Box>
                <Chip label={questionnaire.status} size="small" color={statusColor(questionnaire.status)} />
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Paper sx={{ p: 3, borderRadius: 5, minHeight: 520 }}>
          {!selected ? (
            <Alert severity="info">Select or create a questionnaire.</Alert>
          ) : (
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="h5">{selected.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{selected.requester || "No requester"} - {selected.status}</Typography>
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button variant="contained" disabled={busyId === selected.id} onClick={() => handleGenerate(selected)}>Generate answers</Button>
                  <Button variant="outlined" color="error" disabled={busyId === selected.id} onClick={() => handleDelete(selected)}>Delete</Button>
                </Stack>
              </Stack>

              {selected.questions.map((question) => (
                <Box key={question.id} sx={{ p: 2, borderRadius: 3, bgcolor: "surface.level2", border: "1px solid", borderColor: "divider" }}>
                  <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{question.question}</Typography>
                      <Typography variant="caption" color="text.secondary">{question.category} - confidence {question.confidence || "n/a"}</Typography>
                    </Box>
                    <Chip label={question.status} size="small" color={statusColor(question.status)} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                    {question.answer || "No generated answer yet."}
                  </Typography>
                  <Button size="small" sx={{ mt: 1 }} disabled={!question.answer || busyId === question.id} onClick={() => handleMarkReviewed(selected, question.id)}>
                    Mark reviewed
                  </Button>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
