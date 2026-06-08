// Dashboard API requests.
import { apiFetch } from "./http";
import type { DashboardResponse } from "../types/dashboard";

// Retrieves dashboard overview data for the authenticated user.
export function getDashboard() {
  return apiFetch<DashboardResponse>("/dashboard");
}
