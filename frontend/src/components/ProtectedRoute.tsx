import { Navigate, Outlet, useLocation } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { useAuth } from "../context/useAuth";
import type { UserRole } from "../types/auth";
// Route guard used to protect authenticated pages and role-based access.

// Defines whether authentication is required and which roles are allowed.
type ProtectedRouteProps = {
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
};

// Routes users are allowed to access before completing onboarding.
const onboardingPaths = [
  "/onboarding/select-product",
  "/onboarding/company",
  "/onboarding/scope",
  "/onboarding/frameworks",
  "/change-password",
];

const platformAdminPaths = [
  "/admin",
  "/settings",
  "/settings/change-email",
  "/settings/change-password",
  "/change-password",
];

function pathMatches(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default function ProtectedRoute({
  requireAuth = true,
  allowedRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Shows loading state while authentication status is being resolved.
  if (isLoading)
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );

  // Redirect unauthenticated users to login.
  if (requireAuth && !isAuthenticated)
    return <Navigate to="/login" replace state={{ from: location }} />;

  // Redirect users without the required role.
  if (allowedRoles?.length && (!user || !allowedRoles.includes(user.role)))
    return <Navigate to="/dashboard" replace />;

  // Force users with temporary passwords to change password first.
  if (user?.mustChangePassword && location.pathname !== "/change-password")
    return <Navigate to="/change-password" replace />;

  const isPlatformAdmin = user?.role === "PLATFORM_ADMIN";
  const isPlatformAdminPath = pathMatches(location.pathname, platformAdminPaths);

  if (isPlatformAdmin && !isPlatformAdminPath)
    return <Navigate to="/admin" replace />;

  // Redirect incomplete non-admin users back to onboarding.
  const isOnboardingPath = pathMatches(location.pathname, onboardingPaths);
  if (
    user &&
    !isPlatformAdmin &&
    !user.onboardingCompleted &&
    !isOnboardingPath
  )
    return <Navigate to="/onboarding/select-product" replace />;

  // Render the protected child route when all checks pass.
  return <Outlet />;
}
