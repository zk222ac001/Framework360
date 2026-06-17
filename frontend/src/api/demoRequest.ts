// Demo request API requests.
import { apiFetch } from "./http";
import type {
  DemoRequestFormValues,
  DemoRequestResponse,
  ActivateDemoRequestResponse,
  DeleteDemoRequestResponse,
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

// Updates a submitted demo request from the admin page.
export async function updateDemoRequest(
  id: number,
  values: DemoRequestFormValues,
) {
  return apiFetch<DemoRequestResponse>(`/demo-requests/${id}`, {
    method: "PATCH",
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

// Deletes a demo request and any linked activated user account.
export async function deleteDemoRequest(id: number) {
  return apiFetch<DeleteDemoRequestResponse>(`/demo-requests/${id}`, {
    method: "DELETE",
  });
}
