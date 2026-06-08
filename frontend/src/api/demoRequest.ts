// Demo request API requests.
import { apiFetch } from "./http";
import type {
  DemoRequestFormValues,
  DemoRequestResponse,
  ActivateDemoRequestResponse,
} from "../types/demoRequest";

// Submits public demo access request.
export async function submitDemoRequest(values: DemoRequestFormValues) {
  return apiFetch<DemoRequestResponse>("/demo-requests", {
    method: "POST",
    body: JSON.stringify({
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      companyName: values.companyName,
      jobTitle: values.jobTitle || null,
      country: values.country || null,
    }),
  });
}

// Retrieves all submitted demo requests.
export async function getDemoRequests() {
  return apiFetch<DemoRequestResponse[]>("/demo-requests", { method: "GET" });
}

// Activates demo request and creates company access.
export async function activateDemoRequest(id: number) {
  return apiFetch<ActivateDemoRequestResponse>(
    `/demo-requests/${id}/activate`,
    { method: "POST" },
  );
}
