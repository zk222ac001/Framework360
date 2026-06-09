// Base URL for backend API requests.
// Uses environment variable in production and localhost during development.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:23000";

// Custom error class used for API request failures.
// Includes HTTP status code and backend response data.
export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Shared API helper used for all frontend requests.
// Automatically handles:
// - JSON headers
// - credentials/cookies
// - FormData uploads
// - error handling
// - response parsing
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { headers, body, ...rest } = options;

  // Prevents setting JSON content-type when uploading files.
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    body,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(headers || {}),
    },
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  // Extract readable backend error message if request fails.
  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Request failed";

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

// Returns the current backend base URL.
export function getApiBaseUrl() {
  return API_BASE_URL;
}
