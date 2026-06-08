import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { useTheme } from "../providers/theme-context";
// Toggle switch for changing between light and dark theme.

export default function ThemeToggle() {
  // Reads current theme and toggle function from theme context.
  const { theme, toggleTheme } = useTheme();

  return (
    <FormControlLabel
      control={
        <Switch
          checked={theme === "dark"}
          onChange={toggleTheme}
          color="primary"
        />
      }
      label=""
      sx={{ m: 0 }}
    />
  );
}
