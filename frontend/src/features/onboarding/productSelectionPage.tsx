import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
// First onboarding step for selecting the product package.

export default function ProductSelectionPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Continues onboarding with company details.
  const handleContinue = async () => {
    navigate("/onboarding/company", { replace: true });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        {t("onboarding.product.title")}
      </Typography>

      <Typography variant="body1" sx={{ mb: 3 }}>
        {t("onboarding.product.subtitle")}
      </Typography>

      {/* Available product option */}
      <Stack spacing={2}>
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            border: "2px solid",
            borderColor: "primary.main",
          }}
        >
          <Typography variant="h6">
            {t("onboarding.product.starterTitle")}
          </Typography>

          <Typography variant="body2" sx={{ mt: 1 }}>
            {t("onboarding.product.starterLabel")}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t("onboarding.product.starterDescription")}
          </Typography>
        </Paper>
      </Stack>

      {/* Continue onboarding action */}
      <Button variant="contained" sx={{ mt: 3 }} onClick={handleContinue}>
        {t("onboarding.product.confirm")}
      </Button>
    </Box>
  );
}
