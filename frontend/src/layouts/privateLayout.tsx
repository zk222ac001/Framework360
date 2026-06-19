import { Outlet, Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/useAuth";
import { formatFullName, formatRole } from "../utils/formatters";
import { useTranslation } from "react-i18next";

const sidebarWidth = 288;

function getInitials(first?: string, last?: string, email?: string) {
  const initials = `${first?.[0] || ""}${last?.[0] || ""}`.trim();
  return (initials || email?.slice(0, 2) || "U").toUpperCase();
}

function navIcon(label: string) {
  return (
    <Box sx={{ width: 30, height: 30, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: "surface.level2", color: "primary.main", fontSize: 12, fontWeight: 800 }}>
      {label}
    </Box>
  );
}

function SidebarLink({ to, label, icon }: { to: string; label: string; icon: string }) {
  const location = useLocation();
  const isActive =
    location.pathname === to ||
    (to !== "/dashboard" && to !== "/admin" && location.pathname.startsWith(to));

  return (
    <Link component={RouterLink} to={to} underline="none" color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1.25, py: 1, borderRadius: 3, fontWeight: isActive ? 800 : 650, bgcolor: isActive ? "surface.level2" : "transparent", border: "1px solid", borderColor: isActive ? "divider" : "transparent", boxShadow: isActive ? "0 10px 30px rgba(37, 99, 235, 0.12)" : "none", transition: "all 160ms ease", "&:hover": { bgcolor: "surface.level2", transform: "translateX(2px)" } }}>
      {navIcon(icon)}
      <Typography variant="body2" sx={{ fontWeight: "inherit" }}>{label}</Typography>
    </Link>
  );
}

export default function PrivateLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "PLATFORM_ADMIN";
  const showOnboarding = user && !user.onboardingCompleted && !isAdmin;
  const fullName = formatFullName(user?.firstName, user?.lastName);
  const homePath = isAdmin ? "/admin" : "/dashboard";

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary", display: "flex", width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>
      <Box component="aside" sx={{ width: sidebarWidth, minWidth: sidebarWidth, minHeight: "100vh", position: "sticky", top: 0, display: { xs: "none", md: "flex" }, flexDirection: "column", px: 2.25, py: 2.5, borderRight: "1px solid", borderColor: "divider", bgcolor: "background.paper", backdropFilter: "blur(20px)" }}>
        <Link component={RouterLink} to={homePath} underline="none" sx={{ mb: 3, display: "block" }}>
          <Box component="img" src="/framework360-wordmark.svg" alt="Framework360" sx={{ width: 218, height: 54, objectFit: "contain", objectPosition: "left center", color: "text.primary" }} />
        </Link>

        <Chip label={isAdmin ? "Platform administration" : "Compliance workspace"} color="primary" size="small" sx={{ alignSelf: "flex-start", mb: 2 }} />

        <Stack spacing={0.75} sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
          {isAdmin ? (
            <>
              <SidebarLink to="/admin" label={t("navbar.admin")} icon="AD" />
              <SidebarLink to="/admin/subscriptions" label="Subscriptions" icon="SB" />
              <SidebarLink to="/admin/billing" label="Billing" icon="BL" />
            </>
          ) : (
            <>
              <SidebarLink to="/dashboard" label={t("navbar.dashboard")} icon="DB" />
              <SidebarLink to="/audit" label="Audit Center" icon="AU" />
              <SidebarLink to="/findings" label="Findings" icon="FD" />
              <SidebarLink to="/evidence-campaigns" label="Evidence Campaigns" icon="EC" />
              <SidebarLink to="/workflows" label="Workflows" icon="WF" />
              <SidebarLink to="/copilot" label="AI Copilot" icon="AI" />
              <SidebarLink to="/vendor-risk" label="Vendor Risk" icon="VR" />
              <SidebarLink to="/vendors" label={t("navbar.vendors")} icon="VD" />
              <SidebarLink to="/systems" label={t("navbar.systems")} icon="SY" />
              <SidebarLink to="/business-processes" label={t("navbar.processes")} icon="PR" />
              <SidebarLink to="/dependencies" label={t("navbar.dependencies")} icon="DP" />
              <SidebarLink to="/evidence" label={t("navbar.evidence")} icon="EV" />
              {showOnboarding && <SidebarLink to="/onboarding/select-product" label={t("navbar.continueSetup")} icon="ON" />}
            </>
          )}
        </Stack>

        {!isAdmin && (
          <Box sx={{ p: 2, borderRadius: 4, bgcolor: "surface.level2", border: "1px solid", borderColor: "divider", mb: 2, mt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>Readiness snapshot</Typography>
            <Typography variant="body2" color="text.secondary">Keep frameworks, evidence, vendors and dependencies connected in one place.</Typography>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <Avatar sx={{ width: 42, height: 42 }}>{getInitials(user?.firstName, user?.lastName, user?.email)}</Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>{fullName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{formatRole(user?.role)}</Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
        <Box component="header" sx={{ minHeight: 72, display: "flex", alignItems: "center", justifyContent: "space-between", px: { xs: 2, md: 4 }, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 10, maxWidth: "100%", overflowX: "hidden" }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
            <Box component="img" src="/favicon.svg" alt="Framework360" sx={{ display: { xs: "block", md: "none" }, width: 38, height: 38 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 850 }}>Framework360</Typography>
              <Typography variant="caption" color="text.secondary">{isAdmin ? "Platform admin console" : "Compliance command center"}</Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", flexShrink: 0 }}>
            <ThemeToggle />
            <Button variant="outlined" size="small" onClick={() => navigate("/settings")}>{t("navbar.settings")}</Button>
            <Button variant="outlined" size="small" onClick={handleLogout}>{t("navbar.logout")}</Button>
          </Stack>
        </Box>

        <Box component="main" sx={{ minHeight: "calc(100vh - 72px)", width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
