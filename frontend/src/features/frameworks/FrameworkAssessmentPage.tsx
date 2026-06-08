import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  completeFrameworkAssessment,
  deleteEvidence,
  downloadAssessmentReport,
  getActionPlan,
  getFrameworkAssessment,
  getGaps,
  saveFrameworkAnswers,
  uploadEvidence,
} from "../../api/frameworks";
import type {
  ActionPlanItem,
  ActionPlanResponse,
  AssessmentGap,
  FrameworkAssessment,
  FrameworkRequirement,
  RequirementAnswerStatus,
  SaveFrameworkAnswer,
} from "../../types/framework";
import AssessmentProgressHeader from "./components/AssessmentProgressHeader";
import RequirementChecklistItem from "./components/RequirementChecklistItem";
import SectionStepper from "./components/SectionStepper";
import { formatAnswerStatus, formatPriority } from "../../utils/formatters";
import { useTranslation } from "react-i18next";
// Main assessment page for answering requirements, reviewing gaps and action plans.

// Local answer state for each requirement before saving.
type LocalAnswer = {
  status: RequirementAnswerStatus;
  note: string;
};

type LocalAnswers = Record<number, LocalAnswer>;

// Available assessment views.
type ViewMode = "requirements" | "gaps" | "actions";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

// Builds editable local answer state from backend assessment data.
function buildLocalAnswers(assessment: FrameworkAssessment): LocalAnswers {
  const next: LocalAnswers = {};

  assessment.sections.forEach((section) => {
    section.requirements.forEach((requirement) => {
      next[requirement.id] = {
        status: requirement.answer?.status || "UNANSWERED",
        note: requirement.answer?.note || "",
      };
    });
  });

  return next;
}

// Resumes assessment at first section containing saved progress placeholders.
function findFirstNotApplicableSectionIndex(
  assessment: FrameworkAssessment,
): number {
  const index = assessment.sections.findIndex((section) =>
    section.requirements.some(
      (requirement) => requirement.answer?.status === "NOT_APPLICABLE",
    ),
  );

  return index === -1 ? 0 : index;
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score || 0)));
}

// Normalizes different backend action plan response shapes.
function getActions(
  data: ActionPlanResponse | ActionPlanItem[] | null,
): ActionPlanItem[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;

  return [
    ...(data.highPriority ?? []),
    ...(data.mediumPriority ?? []),
    ...(data.lowPriority ?? []),
    ...(data.actions ?? []),
    ...(data.actionPlan ?? []),
    ...(data.items ?? []),
  ];
}

function getPriorityColor(
  priority?: string,
): "error" | "warning" | "success" | "default" {
  if (priority === "HIGH") return "error";
  if (priority === "MEDIUM") return "warning";
  if (priority === "LOW") return "success";
  return "default";
}

type AnswerStatus = "YES" | "PARTIAL" | "NO" | "NOT_APPLICABLE";

// Prevents unanswered requirements from being saved as normal answers.
function isSaveableStatus(
  status: RequirementAnswerStatus,
): status is AnswerStatus {
  return status !== "UNANSWERED";
}

export default function FrameworkAssessmentPage() {
  const { t } = useTranslation();
  const { code } = useParams();
  const navigate = useNavigate();

  // Assessment data and local UI state.
  const [assessment, setAssessment] = useState<FrameworkAssessment | null>(
    null,
  );
  const [answers, setAnswers] = useState<LocalAnswers>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRequirementIndex, setCurrentRequirementIndex] = useState(0);
  const [isRequirementMenuOpen, setIsRequirementMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("requirements");
  const [gaps, setGaps] = useState<AssessmentGap[]>([]);
  const [totalGaps, setTotalGaps] = useState(0);
  const [actions, setActions] = useState<ActionPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const didHydrate = useRef(false);
  const saveTimer = useRef<number | null>(null);
  const assessmentId = assessment?.assessmentId;

  const currentSection = assessment?.sections[currentIndex] || null;
  const currentSectionId = currentSection?.id;
  const isLastSection = assessment
    ? currentIndex === assessment.sections.length - 1
    : false;

  // Loads assessment and hydrates local answer state.
  const loadAssessment = useCallback(async () => {
    if (!code)
      throw new Error(t("frameworksPage.assessment.errors.missingCode"));
    const data = await getFrameworkAssessment(code);
    setAssessment(data);
    setAnswers(buildLocalAnswers(data));
    return data;
  }, [code, t]);

  // Load assessment when framework code changes.
  useEffect(() => {
    if (!code) {
      setError(t("frameworksPage.assessment.errors.missingCode"));
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);
    didHydrate.current = false;

    loadAssessment()
      .then((data) => {
        if (!isMounted) return;
        setCurrentIndex(findFirstNotApplicableSectionIndex(data));
        didHydrate.current = true;
      })
      .catch((err) => {
        if (isMounted) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    // Prevent state updates and pending autosave after unmount.
    return () => {
      isMounted = false;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [code, loadAssessment, t]);

  // Loads gaps and action plan insights for current assessment.
  const loadInsights = useCallback(async (assessmentId: number) => {
    setIsLoadingInsights(true);
    try {
      const [gapData, actionData] = await Promise.all([
        getGaps(assessmentId),
        getActionPlan(assessmentId),
      ]);
      setGaps(gapData.gaps || []);
      setTotalGaps(gapData.totalGaps || gapData.gaps?.length || 0);
      setActions(getActions(actionData));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoadingInsights(false);
    }
  }, []);

  useEffect(() => {
    if (!assessmentId) return;
    loadInsights(assessmentId);
  }, [assessmentId, loadInsights]);

  // Saveable answers for the currently active section.
  const currentSectionAnswers = useMemo<SaveFrameworkAnswer[]>(() => {
    if (!currentSection) return [];

    return currentSection.requirements.flatMap((requirement) => {
      const answer = answers[requirement.id];

      if (!answer || !isSaveableStatus(answer.status)) {
        return [];
      }

      return [
        {
          requirementId: requirement.id,
          status: answer.status,
          note: answer.note.trim() || undefined,
        },
      ];
    });
  }, [answers, currentSection]);

  // Full assessment payload used when saving overall progress.
  const allAssessmentAnswers = useMemo<SaveFrameworkAnswer[]>(() => {
    if (!assessment) return [];

    return assessment.sections.flatMap((section) =>
      section.requirements.map((requirement) => {
        const answer = answers[requirement.id];

        return {
          requirementId: requirement.id,
          status:
            answer && isSaveableStatus(answer.status)
              ? answer.status
              : "NOT_APPLICABLE",
          note: answer?.note.trim() || undefined,
        };
      }),
    );
  }, [answers, assessment]);

  const visibleRequirements = useMemo(() => {
    return currentSection?.requirements ?? [];
  }, [currentSection]);

  const currentRequirement =
    visibleRequirements[currentRequirementIndex] || null;
  const isLastRequirement =
    currentRequirementIndex >= visibleRequirements.length - 1;

  useEffect(() => {
    setCurrentRequirementIndex(0);
  }, [currentIndex]);

  // Calculates progress for the active section.
  const sectionProgress = useMemo(() => {
    if (!currentSection || currentSection.requirements.length === 0) return 0;
    const answered = currentSection.requirements.filter(
      (requirement) =>
        (answers[requirement.id]?.status || "UNANSWERED") !== "UNANSWERED",
    ).length;
    return clampScore((answered / currentSection.requirements.length) * 100);
  }, [answers, currentSection]);

  // Completion is only allowed when every requirement is answered YES.
  const allRequirementsAreYes = useMemo(() => {
    if (!assessment) return false;

    return assessment.sections.every((section) =>
      section.requirements.every(
        (requirement) => answers[requirement.id]?.status === "YES",
      ),
    );
  }, [assessment, answers]);

  // Updates local answer status for a requirement.
  function updateAnswer(
    requirementId: number,
    status: RequirementAnswerStatus,
  ) {
    setAnswers((previous) => ({
      ...previous,
      [requirementId]: {
        status,
        note: previous[requirementId]?.note || "",
      },
    }));
  }

  // Updates local note for a requirement.
  function updateNote(requirementId: number, note: string) {
    setAnswers((previous) => ({
      ...previous,
      [requirementId]: {
        status: previous[requirementId]?.status || "UNANSWERED",
        note,
      },
    }));
  }

  // Saves current section answers and updates assessment score/status.
  const saveCurrentSection = useCallback(async () => {
    if (!assessmentId) return null;

    const result = await saveFrameworkAnswers(
      assessmentId,
      currentSectionAnswers,
    );

    setAssessment((previous) =>
      previous
        ? {
            ...previous,
            score: result.score,
            status: result.status,
          }
        : previous,
    );

    return result;
  }, [assessmentId, currentSectionAnswers]);

  // Debounced autosave whenever current section answers change.
  useEffect(() => {
    if (!assessmentId || !currentSectionId || !didHydrate.current) return;

    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }

    saveTimer.current = window.setTimeout(async () => {
      if (currentSectionAnswers.length === 0) return;

      setSaveState("saving");

      try {
        await saveCurrentSection();
        setSaveState("saved");
        await loadInsights(assessmentId);
      } catch (err) {
        setError(getErrorMessage(err));
        setSaveState("idle");
      }
    }, 500);

    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, [
    assessmentId,
    currentSectionId,
    currentSectionAnswers,
    saveCurrentSection,
    loadInsights,
  ]);

  // Ensures answer exists before uploading evidence.
  async function handleEvidenceUpload(
    requirement: FrameworkRequirement,
    file: File,
  ) {
    if (!assessment) return;

    let answerId = requirement.answer?.id;

    // Save and reload assessment to get backend answer ID for evidence upload.
    if (!answerId) {
      await saveCurrentSection();
      const refreshedAssessment = await loadAssessment();

      const refreshedRequirement = refreshedAssessment.sections
        .flatMap((section) => section.requirements)
        .find((item) => item.id === requirement.id);

      answerId = refreshedRequirement?.answer?.id;

      if (!answerId) {
        throw new Error(
          t("frameworksPage.assessment.errors.createAnswerFailed"),
        );
      }
    }
    await uploadEvidence(answerId, file);
    await loadAssessment();
    await loadInsights(assessment.assessmentId);
  }

  // Deletes evidence and reloads assessment insights.
  async function handleEvidenceDelete(evidenceId: number) {
    if (!assessment) return;

    setError(null);

    try {
      await deleteEvidence(evidenceId);
      await loadAssessment();
      await loadInsights(assessment.assessmentId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  // Saves current section and moves to next section.
  async function handleSaveAndNext() {
    if (!assessment) return;
    setIsSaving(true);
    setError(null);

    try {
      await saveCurrentSection();
      await loadInsights(assessment.assessmentId);
      setCurrentIndex((index) =>
        Math.min(index + 1, assessment.sections.length - 1),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  function handlePrevious() {
    setCurrentIndex((previous) => Math.max(previous - 1, 0));
  }

  // Saves all answers, defaulting unanswered requirements to not applicable.
  async function handleSaveProgress() {
    if (!assessment) return;

    setIsSaving(true);
    setError(null);

    try {
      const result = await saveFrameworkAnswers(
        assessment.assessmentId,
        allAssessmentAnswers,
      );

      setAssessment((previous) =>
        previous
          ? {
              ...previous,
              score: result.score,
              status: result.status,
            }
          : previous,
      );

      await loadInsights(assessment.assessmentId);
      setSaveState("saved");
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  // Finalizes assessment when all requirements are fully compliant.
  async function handleComplete() {
    if (!assessment) return;
    setIsSaving(true);
    setError(null);

    try {
      await saveCurrentSection();
      await completeFrameworkAssessment(assessment.assessmentId);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  // Downloads generated assessment PDF report.
  async function handleDownloadReport() {
    if (!assessment) return;
    setError(null);
    try {
      await downloadAssessmentReport(assessment.assessmentId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !assessment) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!assessment || !currentSection) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          {t("frameworksPage.assessment.missingAssessment")}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", p: 3 }}>
      <AssessmentProgressHeader
        frameworkName={assessment.framework.name}
        frameworkCode={assessment.framework.code}
        status={assessment.status}
        score={assessment.score}
        currentSection={currentIndex + 1}
        totalSections={assessment.sections.length}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Assessment view switcher and actions */}
      <Paper elevation={1} sx={{ p: 2, borderRadius: 3, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <Button
              variant={viewMode === "requirements" ? "contained" : "outlined"}
              onClick={() => setViewMode("requirements")}
            >
              {t("frameworksPage.assessment.requirements")}
            </Button>
            <Button
              variant={viewMode === "gaps" ? "contained" : "outlined"}
              onClick={() => setViewMode("gaps")}
            >
              {t("frameworksPage.assessment.gaps")}{" "}
              {totalGaps ? `(${totalGaps})` : ""}
            </Button>
            <Button
              variant={viewMode === "actions" ? "contained" : "outlined"}
              onClick={() => setViewMode("actions")}
            >
              {t("frameworksPage.assessment.actionPlan")}{" "}
              {actions.length ? `(${actions.length})` : ""}
            </Button>
          </Stack>

          <Stack
            component="div"
            direction="row"
            spacing={1}
            sx={{ alignItems: "center" }}
          >
            {saveState === "saving" && (
              <Chip
                label={t("frameworksPage.assessment.autosaving")}
                size="small"
              />
            )}
            {saveState === "saved" && (
              <Chip
                label={t("frameworksPage.assessment.saved")}
                color="success"
                size="small"
              />
            )}
            <Button variant="outlined" onClick={handleDownloadReport}>
              {t("frameworksPage.assessment.downloadPdf")}
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Requirements view */}
      {viewMode === "requirements" && (
        <>
          <SectionStepper
            sections={assessment.sections}
            currentIndex={currentIndex}
            answers={answers}
            onStepClick={(index) => {
              setCurrentIndex(index);
              setCurrentRequirementIndex(0);
            }}
          />

          {/* Current section progress */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
              {currentSection.title}
            </Typography>
            {currentSection.description && (
              <Typography color="text.secondary">
                {currentSection.description}
              </Typography>
            )}
            <Box sx={{ mt: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {t("frameworksPage.assessment.sectionProgress")}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {sectionProgress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={sectionProgress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Box>

          <Stack spacing={2}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Button
                variant="outlined"
                startIcon={<MenuIcon />}
                onClick={() => setIsRequirementMenuOpen(true)}
              >
                {t("frameworksPage.assessment.requirement")}
              </Button>

              <Typography variant="body2" color="text.secondary">
                Requirement{" "}
                {visibleRequirements.length === 0
                  ? 0
                  : currentRequirementIndex + 1}{" "}
                of {visibleRequirements.length}
              </Typography>
            </Box>

            {/* Current requirement */}
            {currentRequirement ? (
              <RequirementChecklistItem
                key={currentRequirement.id}
                requirement={currentRequirement}
                value={answers[currentRequirement.id]?.status || "UNANSWERED"}
                note={answers[currentRequirement.id]?.note || ""}
                onChange={(status) =>
                  updateAnswer(currentRequirement.id, status)
                }
                onNoteChange={(note) => updateNote(currentRequirement.id, note)}
                onEvidenceUpload={handleEvidenceUpload}
                onEvidenceDelete={handleEvidenceDelete}
              />
            ) : (
              <Alert severity="info">
                {t("frameworksPage.assessment.noMatchingRequirements")}
              </Alert>
            )}
          </Stack>

          {/* Assessment navigation actions */}
          <Stack
            direction="row"
            spacing={2}
            sx={{ justifyContent: "space-between" }}
          >
            <Button
              variant="outlined"
              disabled={
                (currentIndex === 0 && currentRequirementIndex === 0) ||
                isSaving
              }
              onClick={() => {
                if (currentRequirementIndex > 0) {
                  setCurrentRequirementIndex((index) => index - 1);
                } else {
                  handlePrevious();
                }
              }}
            >
              {t("frameworksPage.assessment.previous")}
            </Button>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                disabled={isSaving}
                onClick={handleSaveProgress}
              >
                {isSaving
                  ? t("frameworksPage.assessment.saving")
                  : t("frameworksPage.assessment.saveProgress")}
              </Button>

              {isLastSection && allRequirementsAreYes ? (
                <Button
                  variant="contained"
                  disabled={isSaving}
                  onClick={handleComplete}
                >
                  {isSaving
                    ? t("frameworksPage.assessment.completing")
                    : t("frameworksPage.assessment.complete")}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  disabled={isSaving}
                  onClick={() => {
                    if (!isLastRequirement) {
                      setCurrentRequirementIndex((index) => index + 1);
                      return;
                    }

                    handleSaveAndNext();
                  }}
                >
                  {isSaving
                    ? "Saving..."
                    : isLastRequirement
                      ? t("frameworksPage.assessment.saveNextSection")
                      : t("frameworksPage.assessment.nextRequirement")}
                </Button>
              )}
            </Stack>
          </Stack>
        </>
      )}

      {/* Requirement navigation drawer */}
      <Drawer
        anchor="left"
        open={isRequirementMenuOpen}
        onClose={() => setIsRequirementMenuOpen(false)}
      >
        <Box sx={{ width: 360, p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            {t("frameworksPage.assessment.requirement")}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {currentSection.title}
          </Typography>

          <List>
            {visibleRequirements.map((requirement, index) => (
              <ListItemButton
                key={requirement.id}
                selected={index === currentRequirementIndex}
                onClick={() => {
                  setCurrentRequirementIndex(index);
                  setIsRequirementMenuOpen(false);
                }}
              >
                <ListItemText
                  primary={`${index + 1}. ${requirement.question}`}
                  secondary={formatAnswerStatus(
                    answers[requirement.id]?.status || "UNANSWERED",
                  )}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Gaps view */}
      {viewMode === "gaps" && (
        <Stack spacing={2}>
          {isLoadingInsights && <CircularProgress size={24} />}
          {gaps.length === 0 ? (
            <Alert severity="success">
              {t("frameworksPage.assessment.noGaps")}
            </Alert>
          ) : (
            gaps.map((gap, index) => (
              <Paper
                key={`${gap.requirementId || index}-gap`}
                elevation={2}
                sx={{ p: 3, borderRadius: 3 }}
              >
                <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
                  {gap.status && (
                    <Chip
                      label={formatAnswerStatus(gap.status)}
                      color={gap.status === "NO" ? "error" : "warning"}
                      size="small"
                    />
                  )}
                  {gap.missingEvidence && (
                    <Chip
                      label={t("frameworksPage.assessment.missingEvidence")}
                      size="small"
                    />
                  )}
                  {gap.sectionTitle && (
                    <Chip
                      label={gap.sectionTitle}
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>
                <Typography variant="h6">
                  {gap.question || t("frameworksPage.assessment.complianceGap")}
                </Typography>
                {gap.reason && (
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {gap.reason}
                  </Typography>
                )}
                {gap.riskIfMissing && (
                  <Typography sx={{ mt: 1 }}>{gap.riskIfMissing}</Typography>
                )}
              </Paper>
            ))
          )}
        </Stack>
      )}

      {/* Action plan view */}
      {viewMode === "actions" && (
        <Stack spacing={2}>
          {isLoadingInsights && <CircularProgress size={24} />}
          {actions.length === 0 ? (
            <Alert severity="info">
              {t("frameworksPage.assessment.noActions")}
            </Alert>
          ) : (
            actions.map((action, index) => (
              <Paper
                key={`${action.id || action.requirementId || index}-action`}
                elevation={2}
                sx={{ p: 3, borderRadius: 3 }}
              >
                <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
                  <Chip
                    label={formatPriority(action.priority || "ACTION")}
                    color={getPriorityColor(action.priority)}
                    size="small"
                  />
                  {action.status && (
                    <Chip
                      label={formatAnswerStatus(action.status)}
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>
                <Typography variant="h6">
                  {action.title ||
                    action.question ||
                    t("frameworksPage.assessment.recommendedAction")}
                </Typography>
                {(action.action || action.implementationGuide) && (
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {action.action || action.implementationGuide}
                  </Typography>
                )}
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1}>
                  {(action.risk || action.riskIfMissing) && (
                    <Typography variant="body2">
                      <strong>{t("frameworksPage.assessment.risk")}</strong>{" "}
                      {action.risk || action.riskIfMissing}
                    </Typography>
                  )}
                  {(action.evidenceNeeded || action.exampleEvidence) && (
                    <Typography variant="body2">
                      <strong>
                        {t("frameworksPage.assessment.evidenceNeeded")}
                      </strong>{" "}
                      {action.evidenceNeeded || action.exampleEvidence}
                    </Typography>
                  )}
                </Stack>
              </Paper>
            ))
          )}
        </Stack>
      )}
    </Box>
  );
}
