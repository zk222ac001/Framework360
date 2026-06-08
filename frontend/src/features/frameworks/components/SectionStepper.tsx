import Box from "@mui/material/Box";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";
import Stepper from "@mui/material/Stepper";
import Typography from "@mui/material/Typography";
import type {
  FrameworkSection,
  RequirementAnswerStatus,
} from "../../../types/framework";
import { useTranslation } from "react-i18next";
// Stepper navigation between assessment sections.

// Local answer state used to determine section completion.
type LocalAnswer = {
  status: RequirementAnswerStatus;
  note: string;
};

type LocalAnswers = Record<number, LocalAnswer>;

type Props = {
  sections: FrameworkSection[];
  currentIndex: number;
  answers: LocalAnswers;
  onStepClick: (index: number) => void;
};

export default function SectionStepper({
  sections,
  currentIndex,
  answers,
  onStepClick,
}: Props) {
  const { t } = useTranslation();

  // A section is completed when all requirements have been answered.
  function isSectionCompleted(section: FrameworkSection) {
    if (section.requirements.length === 0) return false;

    return section.requirements.every((requirement) => {
      const status = answers[requirement.id]?.status || "UNANSWERED";

      return status === "YES" || status === "PARTIAL" || status === "NO";
    });
  }

  return (
    <Box sx={{ mb: 3 }}>
      {/* Desktop section stepper */}
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <Stepper activeStep={currentIndex} alternativeLabel>
          {sections.map((section, index) => (
            <Step key={section.id} completed={isSectionCompleted(section)}>
              <StepButton
                disabled={false}
                onClick={() => onStepClick(index)}
                sx={{
                  cursor: "pointer",
                  "& .MuiStepLabel-label": {
                    cursor: "pointer",
                  },
                  "& .MuiStepIcon-root": {
                    cursor: "pointer",
                  },
                }}
              >
                {section.title}
              </StepButton>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Mobile section indicator */}
      <Typography
        sx={{ display: { xs: "block", md: "none" } }}
        color="text.secondary"
      >
        {t("frameworksPage.assessment.section")} {currentIndex + 1}{" "}
        {t("frameworksPage.assessment.of")} {sections.length}:{" "}
        {sections[currentIndex]?.title}
      </Typography>
    </Box>
  );
}
