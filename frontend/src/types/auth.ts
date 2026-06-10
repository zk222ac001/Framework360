// Type definitions for authentication and user session data.

// Supported application user roles.
export type UserRole =
  | "PLATFORM_ADMIN"
  | "CUSTOMER_ADMIN"
  | "ADMIN"
  | "USER"
  | "DEMO_USER";

export type AuthCompany = {
  id: number;
  name?: string | null;
  cvr?: string | null;
  sector?: string | null;
  country?: string | null;
  frameworks?: unknown[];
};

export type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive?: boolean;
  mustChangePassword: boolean;
  onboardingCompleted: boolean;
  companyId?: number | null;
  company?: AuthCompany | null;
};

// API payloads and responses for authentication actions.
export type LoginResponse = {
  message?: string;
  user: AuthUser;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ForgotPasswordResponse = {
  message: string;
  resetToken?: string;
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type UpdateProfilePayload = {
  firstName?: string;
  lastName?: string;
};

export type UpdateEmailPayload = {
  currentPassword: string;
  newEmail: string;
};

export type UpdateUserResponse = {
  message: string;
  user: AuthUser;
};