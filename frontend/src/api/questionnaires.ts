import { apiFetch } from "./http";

export type SecurityQuestionnaireQuestion = {
  id: string;
  question: string;
  category: string;
  answer?: string | null;
  confidence?: string | null;
  sourceRefs: Array<Record<string, unknown>>;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type SecurityQuestionnaire = {
  id: string;
  title: string;
  requester?: string | null;
  status: string;
  source?: string | null;
  totalQuestions: number;
  answeredQuestions: number;
  createdAt: string;
  updatedAt: string;
  questions: SecurityQuestionnaireQuestion[];
};

export function getQuestionnaires() {
  return apiFetch<{ questionnaires: SecurityQuestionnaire[] }>("/questionnaires");
}

export function createQuestionnaire(payload: {
  title: string;
  requester?: string | null;
  source?: string | null;
  questions: string[];
}) {
  return apiFetch<{ questionnaire: SecurityQuestionnaire }>("/questionnaires", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function generateQuestionnaireAnswers(id: string) {
  return apiFetch<{ questionnaire: SecurityQuestionnaire }>(`/questionnaires/${id}/generate`, {
    method: "POST",
  });
}

export function updateQuestionnaireQuestion(questionnaireId: string, questionId: string, payload: {
  answer?: string | null;
  status?: "UNANSWERED" | "GENERATED" | "REVIEWED" | "APPROVED";
}) {
  return apiFetch<{ question: SecurityQuestionnaireQuestion }>(`/questionnaires/${questionnaireId}/questions/${questionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteQuestionnaire(id: string) {
  return apiFetch<{ message: string }>(`/questionnaires/${id}`, {
    method: "DELETE",
  });
}
