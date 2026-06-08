// Business process register API requests.
import { apiFetch } from "./http";
import type {
  BusinessProcess,
  BusinessProcessPayload,
} from "../types/systemRegister";

type BusinessProcessesResponse = {
  businessProcesses: BusinessProcess[];
};

type BusinessProcessResponse = {
  businessProcess: BusinessProcess;
};

// Retrieves all business processes.
export function getBusinessProcesses() {
  return apiFetch<BusinessProcessesResponse>("/business-processes");
}

// Creates a new business process.
export function createBusinessProcess(payload: BusinessProcessPayload) {
  return apiFetch<BusinessProcessResponse>("/business-processes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Updates business process information.
export function updateBusinessProcess(
  id: number,
  payload: BusinessProcessPayload,
) {
  return apiFetch<BusinessProcessResponse>(`/business-processes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// Deletes business process.
export function deleteBusinessProcess(id: number) {
  return apiFetch<{ message: string }>(`/business-processes/${id}`, {
    method: "DELETE",
  });
}
