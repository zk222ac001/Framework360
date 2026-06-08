// System register API requests.
import { apiFetch } from "./http";
import type { SystemAsset, SystemAssetPayload } from "../types/systemRegister";

type SystemsResponse = {
  systems: SystemAsset[];
};

type SystemResponse = {
  system: SystemAsset;
};

// Retrieves all registered systems.
export function getSystems() {
  return apiFetch<SystemsResponse>("/systems");
}

// Creates a new system entry.
export function createSystem(payload: SystemAssetPayload) {
  return apiFetch<SystemResponse>("/systems", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Updates system information.
export function updateSystem(id: number, payload: SystemAssetPayload) {
  return apiFetch<SystemResponse>(`/systems/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// Deletes system entry.
export function deleteSystem(id: number) {
  return apiFetch<{ message: string }>(`/systems/${id}`, {
    method: "DELETE",
  });
}
