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
import AuditCenterPage from "../features/audit/AuditCenterPage";
import AuditFindingsPage from "../features/auditFindings/AuditFindingsPage";
import WorkflowApprovalsPage from "../features/workflows/WorkflowApprovalsPage";
import AiComplianceCopilotPage from "../features/copilot/AiComplianceCopilotPage";
import VendorRiskCenterPage from "../features/vendorRisk/VendorRiskCenterPage";
import EvidenceCampaignsPage from "../features/evidenceCampaigns/EvidenceCampaignsPage";
import ProtectedRoute from "../components/ProtectedRoute";

function PricingPage() {
  return <Typography>Pricing page</Typography>;
}

function FeaturesPage() {
  return <Typography>Features page</Typography>;
}

function AboutPage() {
  return <Typography>About page</Typography>;
}

const router = createBrowserRouter([
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
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <PrivateLayout />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/audit", element: <AuditCenterPage /> },
          { path: "/findings", element: <AuditFindingsPage /> },
          { path: "/evidence-campaigns", element: <EvidenceCampaignsPage /> },
          { path: "/workflows", element: <WorkflowApprovalsPage /> },
          { path: "/copilot", element: <AiComplianceCopilotPage /> },
          { path: "/vendor-risk", element: <VendorRiskCenterPage /> },
          { path: "/vendors", element: <VendorsPage /> },
          { path: "/systems", element: <SystemsPage /> },
          { path: "/business-processes", element: <BusinessProcessesPage /> },
          { path: "/dependencies", element: <DependenciesPage /> },
          { path: "/frameworks/add", element: <AddFrameworkPage /> },
          { path: "/frameworks/:code", element: <FrameworkAssessmentPage /> },
          { path: "/change-password", element: <ChangePasswordPage /> },
          { path: "/settings", element: <AccountSettingsPage /> },
          { path: "/settings/change-email", element: <ChangeEmailPage /> },
          { path: "/settings/change-password", element: <ChangePasswordPage /> },
          { path: "/onboarding/select-product", element: <ProductSelectionPage /> },
          { path: "/onboarding/company", element: <CompanyOnboardingPage /> },
          { path: "/onboarding/scope", element: <ScopeOnboardingPage /> },
          { path: "/onboarding/frameworks", element: <FrameworkSelectionOnboardingPage /> },
          { path: "/evidence", element: <EvidenceOverviewPage /> },
        ],
      },
    ],
  },
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

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
