import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { FrameworkDefinition } from "../../../types/framework";
import { formatFrameworkCode } from "../../../utils/formatters";
import { useTranslation } from "react-i18next";
// Card used when selecting a framework to start or continue.

// Framework data and start action passed from add framework page.
type Props = {
  framework: FrameworkDefinition;
  isStarting?: boolean;
  onStart: (code: string) => void;
};

export default function FrameworkCard({
  framework,
  isStarting = false,
  onStart,
}: Props) {
  const { t } = useTranslation();

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Framework title and category */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 1,
          alignItems: "flex-start",
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {framework.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatFrameworkCode(framework.code)}
          </Typography>
        </Box>
        {framework.category && <Chip label={framework.category} size="small" />}
      </Box>

      {/* Framework description */}
      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
        {framework.description || t("frameworksPage.add.fallbackDescription")}
      </Typography>

      {/* Start framework action */}
      <Button
        variant="contained"
        onClick={() => onStart(framework.code)}
        disabled={isStarting}
      >
        {isStarting
          ? t("frameworksPage.add.starting")
          : t("frameworksPage.add.startContinue")}
      </Button>
    </Paper>
  );
}
