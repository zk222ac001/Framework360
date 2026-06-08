import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Typography from "@mui/material/Typography";
import PublicLayout from "../layouts/publicLayout";
import PrivateLayout from "../layouts/privateLayout";
import LandingPage from "../features/landing/landingPage";
import DashboardPage from "../features/dashboard/dashboardPage";
import LoginPage from "../features/auth/loginPage";
import RequestDemoPage from "../features/auth/requestDemoPage";
import ChangePasswordPage from "../features/auth/changePasswordPage";
import AdminPage from "../features/admin/adminPage";
import ProductSelectionPage from "../features/onboarding/productSelectionPage";
import CompanyOnboardingPage from "../features/onboarding/companyOnboardingPage";
import AddFrameworkPage from "../features/frameworks/AddFrameworkPage";
import FrameworkAssessmentPage from "../features/frameworks/FrameworkAssessmentPage";
import FrameworkSelectionOnboardingPage from "../features/onboarding/frameworkSelectionOnboardingPage";
import AccountSettingsPage from "../features/settings/AccountSettingsPage";
import ChangeEmailPage from "../features/settings/ChangeEmailPage";
import ScopeOnboardingPage from "../features/onboarding/scopeOnboardingPage";
import EvidenceOverviewPage from "../features/evidence/EvidenceOverviewPage";
import VendorsPage from "../features/vendors/VendorsPage";
import SystemsPage from "../features/systems/SystemsPage";
import BusinessProcessesPage from "../features/businessProcesses/BusinessProcessesPage";
import DependenciesPage from "../features/dependencies/DependenciesPage";
import ProtectedRoute from "../components/ProtectedRoute";
// Central route configuration for public, private and admin pages.

// Temporary placeholder pages for public marketing routes.
function PricingPage() {
  return <Typography>Pricing page</Typography>;
}

// Temporary placeholder pages for public marketing routes.
function FeaturesPage() {
  return <Typography>Features page</Typography>;
}

// Temporary placeholder pages for public marketing routes.
function AboutPage() {
  return <Typography>About page</Typography>;
}

// Application routes grouped by access level.
const router = createBrowserRouter([
  // Public routes available without authentication.
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "features", element: <FeaturesPage /> },
      { path: "pricing", element: <PricingPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "requestdemo", element: <RequestDemoPage /> },
    ],
  },

  // Authenticated customer routes.
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <PrivateLayout />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/vendors", element: <VendorsPage /> },
          { path: "/systems", element: <SystemsPage /> },
          { path: "/business-processes", element: <BusinessProcessesPage /> },
          { path: "/dependencies", element: <DependenciesPage /> },
          { path: "/frameworks/add", element: <AddFrameworkPage /> },
          { path: "/frameworks/:code", element: <FrameworkAssessmentPage /> },
          { path: "/change-password", element: <ChangePasswordPage /> },
          { path: "/settings", element: <AccountSettingsPage /> },
          { path: "/settings/change-email", element: <ChangeEmailPage /> },
          {
            path: "/settings/change-password",
            element: <ChangePasswordPage />,
          },
          {
            path: "/onboarding/select-product",
            element: <ProductSelectionPage />,
          },
          {
            path: "/onboarding/company",
            element: <CompanyOnboardingPage />,
          },
          {
            path: "/onboarding/scope",
            element: <ScopeOnboardingPage />,
          },
          {
            path: "/onboarding/frameworks",
            element: <FrameworkSelectionOnboardingPage />,
          },
          {
            path: "/evidence",
            element: <EvidenceOverviewPage />,
          },
        ],
      },
    ],
  },

  // Platform admin only routes.
  {
    element: <ProtectedRoute allowedRoles={["PLATFORM_ADMIN"]} />,
    children: [
      {
        element: <PrivateLayout />,
        children: [{ path: "/admin", element: <AdminPage /> }],
      },
    ],
  },
]);

// Provides configured React Router instance to the app.
export default function AppRouter() {
  return <RouterProvider router={router} />;
}
