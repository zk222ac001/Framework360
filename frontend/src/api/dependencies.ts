// Dependency register API requests.
import { apiFetch } from "./http";
import type { Dependency, DependencyPayload } from "../types/systemRegister";

type DependenciesResponse = {
  dependencies: Dependency[];
};

type DependencyResponse = {
  dependency: Dependency;
};

// Retrieves all dependencies.
export function getDependencies() {
  return apiFetch<DependenciesResponse>("/dependencies");
}

// Creates a new dependency.
export function createDependency(payload: DependencyPayload) {
  return apiFetch<DependencyResponse>("/dependencies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Updates dependency information.
export function updateDependency(id: number, payload: DependencyPayload) {
  return apiFetch<DependencyResponse>(`/dependencies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// Deletes dependency.
export function deleteDependency(id: number) {
  return apiFetch<{ message: string }>(`/dependencies/${id}`, {
    method: "DELETE",
  });
}
