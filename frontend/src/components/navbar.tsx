import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../context/useAuth";
import { formatEmail, formatFullName, formatRole } from "../utils/formatters";
import { useTranslation } from "react-i18next";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
// Main navigation component used for both public and authenticated layouts.

// Controls whether the navbar renders public or private navigation links.
type NavbarProps = { variant: "public" | "private" };

// Shared brand/logo link used in both navbar variants.
function BrandLink({ to }: { to: string }) {
  return (
    <Link
      component={RouterLink}
      to={to}
      underline="none"
      color="text.primary"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        fontSize: "1.25rem",
        fontWeight: 600,
        letterSpacing: "-0.02em",
        mr: 4,
      }}
    >
      <Box
        component="img"
        src="/favicon.svg"
        alt="logo"
        sx={{ width: 32, height: 32 }}
      />
      <Typography
        variant="h6"
        sx={{ display: { xs: "none", md: "block" }, fontWeight: 600 }}
      >
        Framework360
      </Typography>
    </Link>
  );
}

// Creates fallback initials for the user avatar.
function getInitials(first?: string, last?: string, email?: string) {
  const initials = `${first?.[0] || ""}${last?.[0] || ""}`.trim();
  return (initials || email?.slice(0, 2) || "U").toUpperCase();
}

function Navbar({ variant }: NavbarProps) {
  const { t, i18n } = useTranslation();
  const [languageAnchorEl, setLanguageAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Logs out the user and redirects back to login.
  async function handleLogout() {
    setAnchorEl(null);
    await logout();
    navigate("/login", { replace: true });
  }

  // Stores selected language locally and updates i18n.
  function handleLanguageChange(language: "en" | "da") {
    localStorage.setItem("language", language);
    void i18n.changeLanguage(language);
    setLanguageAnchorEl(null);
  }

  const currentLanguageLabel =
    i18n.language === "da" ? "🇩🇰 Danish" : "🇬🇧 English";

  // Authenticated navbar with dashboard navigation and user menu.
  if (variant === "private") {
    const isAdmin = user?.role === "PLATFORM_ADMIN";
    const showOnboarding = user && !user.onboardingCompleted && !isAdmin;
    const fullName = formatFullName(user?.firstName, user?.lastName);

    return (
      <AppBar position="static" sx={{ width: "100%" }}>
        <Box sx={{ width: "100%", px: 3 }}>
          <Toolbar disableGutters sx={{ minHeight: 72, gap: 2 }}>
            <BrandLink to="/dashboard" />

            {/* Main private navigation links */}
            <Box
              sx={{ display: { xs: "none", md: "flex" }, gap: 3, flexGrow: 1 }}
            >
              <Link
                component={RouterLink}
                to="/dashboard"
                underline="none"
                color="text.secondary"
              >
                {t("navbar.dashboard")}
              </Link>
              <Link
                component={RouterLink}
                to="/vendors"
                underline="none"
                color="text.secondary"
              >
                {t("navbar.vendors")}
              </Link>
              <Link
                component={RouterLink}
                to="/systems"
                underline="none"
                color="text.secondary"
              >
                {t("navbar.systems")}
              </Link>
              <Link
                component={RouterLink}
                to="/business-processes"
                underline="none"
                color="text.secondary"
              >
                {t("navbar.processes")}
              </Link>
              <Link
                component={RouterLink}
                to="/dependencies"
                underline="none"
                color="text.secondary"
              >
                {t("navbar.dependencies")}
              </Link>
              <Link
                component={RouterLink}
                to="/evidence"
                underline="none"
                color="text.secondary"
              >
                {t("navbar.evidence")}
              </Link>
              {showOnboarding && (
                <Link
                  component={RouterLink}
                  to="/onboarding/select-product"
                  underline="none"
                  color="text.secondary"
                >
                  {t("navbar.continueSetup")}
                </Link>
              )}
              {isAdmin && (
                <Link
                  component={RouterLink}
                  to="/admin"
                  underline="none"
                  color="text.secondary"
                >
                  {t("navbar.admin")}
                </Link>
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <ThemeToggle />

              {/* Language selector */}
              <Button
                size="small"
                variant="outlined"
                endIcon={<ExpandMoreIcon />}
                onClick={(event) => setLanguageAnchorEl(event.currentTarget)}
              >
                {currentLanguageLabel}
              </Button>
              <Menu
                anchorEl={languageAnchorEl}
                open={Boolean(languageAnchorEl)}
                onClose={() => setLanguageAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem onClick={() => handleLanguageChange("en")}>
                  🇬🇧 English
                </MenuItem>

                <MenuItem onClick={() => handleLanguageChange("da")}>
                  🇩🇰 Danish
                </MenuItem>
              </Menu>

              {/* User menu */}
              <IconButton
                onClick={(event) => setAnchorEl(event.currentTarget)}
                size="small"
                aria-label="Open user menu"
              >
                <Avatar>
                  {getInitials(user?.firstName, user?.lastName, user?.email)}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <Box sx={{ px: 2, py: 1, minWidth: 260 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {fullName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatEmail(user?.email)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatRole(user?.role)}
                  </Typography>
                  {user?.company?.name && (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {user.company.name}
                    </Typography>
                  )}
                </Box>
                <Divider />
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    navigate("/settings");
                  }}
                >
                  <ListItemText primary={t("navbar.settings")} />
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemText primary={t("navbar.logout")} />
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Box>
      </AppBar>
    );
  }

  // Public navbar shown on landing, login and marketing pages.
  return (
    <AppBar position="static">
      <Box sx={{ width: "100%", px: 3 }}>
        <Toolbar disableGutters sx={{ minHeight: 72, gap: 2 }}>
          <BrandLink to="/" />

          {/* Public navigation links */}
          <Box
            sx={{ display: { xs: "none", md: "flex" }, gap: 4, flexGrow: 1 }}
          >
            <Link
              component={RouterLink}
              to="/features"
              underline="none"
              color="text.secondary"
            >
              Features
            </Link>
            <Link
              component={RouterLink}
              to="/pricing"
              underline="none"
              color="text.secondary"
            >
              Pricing
            </Link>
            <Link
              component={RouterLink}
              to="/about"
              underline="none"
              color="text.secondary"
            >
              About
            </Link>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <ThemeToggle />
            <Button
              size="small"
              variant="outlined"
              endIcon={<ExpandMoreIcon />}
              onClick={(event) => setLanguageAnchorEl(event.currentTarget)}
            >
              {currentLanguageLabel}
            </Button>

            <Menu
              anchorEl={languageAnchorEl}
              open={Boolean(languageAnchorEl)}
              onClose={() => setLanguageAnchorEl(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem onClick={() => handleLanguageChange("en")}>
                🇬🇧 English
              </MenuItem>

              <MenuItem onClick={() => handleLanguageChange("da")}>
                🇩🇰 Danish
              </MenuItem>
            </Menu>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              color="primary"
            >
              {t("navbar.login")}
            </Button>
            <Button
              component={RouterLink}
              to="/requestdemo"
              variant="contained"
              color="primary"
            >
              {t("navbar.requestDemo")}
            </Button>
          </Box>
        </Toolbar>
      </Box>
    </AppBar>
  );
}

export default Navbar;
