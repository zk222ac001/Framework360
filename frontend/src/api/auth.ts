import { apiFetch } from "./http";
import type {
  ChangePasswordPayload,
  LoginPayload,
  LoginResponse,
  AuthUser,
  UpdateEmailPayload,
  UpdateProfilePayload,
  UpdateUserResponse,
} from "../types/auth";

// Authentication API requests.
type MeResponse = AuthUser | { user: AuthUser };

// Normalizes backend response shape to always return the user object.
function unwrapUser(response: MeResponse): AuthUser {
  return "user" in response ? response.user : response;
}

// Sends login credentials and returns authenticated user data.
export async function login(payload: LoginPayload) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Fetches the currently authenticated user.
export async function getMe() {
  const response = await apiFetch<MeResponse>("/auth/me", { method: "GET" });
  return unwrapUser(response);
}

// Logs out the current user and clears authentication session.
export async function logoutRequest() {
  return apiFetch<{ message: string }>("/auth/logout", { method: "POST" });
}

// Updates the authenticated user's password.
export async function changePassword(payload: ChangePasswordPayload) {
  return apiFetch<{ message: string }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Updates profile information for the current user.
export async function updateMyProfile(payload: UpdateProfilePayload) {
  return apiFetch<UpdateUserResponse>("/auth/me/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// Updates the current user's email address.
export async function updateMyEmail(payload: UpdateEmailPayload) {
  return apiFetch<UpdateUserResponse>("/auth/me/email", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
