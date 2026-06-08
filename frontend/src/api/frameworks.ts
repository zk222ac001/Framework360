// Framework assessment API requests.
import { apiFetch, getApiBaseUrl } from "./http";
import type {
  ActionPlanResponse,
  CompleteFrameworkAssessmentResponse,
  FrameworkAssessment,
  FrameworkAssessmentSummary,
  FrameworkCode,
  FrameworkDefinition,
  GapsResponse,
  SaveFrameworkAnswer,
} from "../types/framework";

// Retrieves all available compliance frameworks.
export function getFrameworks() {
  return apiFetch<FrameworkDefinition[]>("/frameworks");
}

// Starts a new assessment for the selected framework.
export function startFrameworkAssessment(code: FrameworkCode | string) {
  return apiFetch<FrameworkAssessmentSummary>(`/frameworks/${code}/start`, {
    method: "POST",
  });
}

// Fetches assessment data including sections and requirements.
export function getFrameworkAssessment(code: FrameworkCode | string) {
  return apiFetch<FrameworkAssessment>(`/frameworks/${code}/assessment`);
}

// Saves requirement answers for an assessment.
export function saveFrameworkAnswers(
  assessmentId: number,
  answers: SaveFrameworkAnswer[],
) {
  return apiFetch<FrameworkAssessmentSummary>(
    `/frameworks/assessments/${assessmentId}/answers`,
    {
      method: "PATCH",
      body: JSON.stringify({ answers }),
    },
  );
}

// Marks an assessment as completed.
export function completeFrameworkAssessment(assessmentId: number) {
  return apiFetch<CompleteFrameworkAssessmentResponse>(
    `/frameworks/assessments/${assessmentId}/complete`,
    { method: "POST" },
  );
}

// Retrieves identified compliance gaps for an assessment.
export function getGaps(assessmentId: number) {
  return apiFetch<GapsResponse>(`/frameworks/assessments/${assessmentId}/gaps`);
}

// Retrieves generated action plan items for unresolved gaps.
export function getActionPlan(assessmentId: number) {
  return apiFetch<ActionPlanResponse>(
    `/frameworks/assessments/${assessmentId}/action-plan`,
  );
}

// Uploads evidence file for a specific requirement answer.
export function uploadEvidence(answerId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch(`/answers/${answerId}/evidence`, {
    method: "POST",
    body: formData,
  });
}

// Downloads generated PDF assessment report.
export async function downloadAssessmentReport(assessmentId: number) {
  const response = await fetch(
    `${getApiBaseUrl()}/frameworks/assessments/${assessmentId}/report`,
    { credentials: "include" },
  );

  if (!response.ok) throw new Error("Could not download report");

  // Creates temporary browser download link for PDF file.
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `assessment-${assessmentId}-report.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// Returns direct URL for assessment report download.
export function getReportUrl(assessmentId: number) {
  return `${getApiBaseUrl()}/frameworks/assessments/${assessmentId}/report`;
}

// Returns direct URL for evidence file access.
export function getEvidenceFileUrl(id: number) {
  return `${getApiBaseUrl()}/evidence/${id}/file`;
}

// Deletes uploaded evidence file.
export function deleteEvidence(evidenceId: number) {
  return apiFetch<{ message: string }>(`/evidence/${evidenceId}`, {
    method: "DELETE",
  });
}
