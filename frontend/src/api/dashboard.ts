// Dashboard API requests.
import { apiFetch } from "./http";
import type { DashboardResponse } from "../types/dashboard";

// Retrieves dashboard overview data for the authenticated user.
export function getDashboard() {
  return apiFetch<DashboardResponse>("/dashboard");
}

// Downloads the executive compliance report PDF for the authenticated company.
export async function downloadExecutiveReport() {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/reports/executive`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Could not download executive report");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "framework360-executive-report.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
