function getAnswerValue(status) {
  switch (status) {
    case 'YES':
      return 1;
    case 'PARTIAL':
      return 0.5;
    case 'NO':
    case 'UNANSWERED':
      return 0;
    case 'NOT_APPLICABLE':
      return null;
    default:
      return 0;
  }
}

function calculateAssessmentScore(assessment) {
  const sections = assessment.frameworkDefinition.sections || [];

  let totalSectionWeight = 0;
  let weightedSectionScoreSum = 0;

  let totalCount = 0;
  let answeredCount = 0;

  const sectionScores = sections.map((section) => {
    let applicableWeight = 0;
    let earnedWeight = 0;

    let sectionTotalCount = 0;
    let sectionAnsweredCount = 0;

    for (const requirement of section.requirements) {
      sectionTotalCount += 1;
      totalCount += 1;

      const answer = assessment.answers.find(
        (item) => item.requirementId === requirement.id,
      );

      const status = answer?.status || 'UNANSWERED';

      if (status !== 'UNANSWERED') {
        sectionAnsweredCount += 1;
        answeredCount += 1;
      }

      const value = getAnswerValue(status);

      if (value === null) {
        continue;
      }

      applicableWeight += requirement.weight;
      earnedWeight += value * requirement.weight;
    }

    const sectionScore =
      applicableWeight > 0
        ? Math.round((earnedWeight / applicableWeight) * 100)
        : 0;

    const sectionProgressPercentage =
      sectionTotalCount > 0
        ? Math.round((sectionAnsweredCount / sectionTotalCount) * 100)
        : 0;

    totalSectionWeight += section.weight;
    weightedSectionScoreSum += sectionScore * section.weight;

    return {
      sectionId: section.id,
      sectionScore,
      sectionProgressPercentage,
      answeredCount: sectionAnsweredCount,
      totalCount: sectionTotalCount,
    };
  });

  const score =
    totalSectionWeight > 0
      ? Math.round(weightedSectionScoreSum / totalSectionWeight)
      : 0;

  const progressPercentage =
    totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  return {
    score,
    progressPercentage,
    answeredCount,
    totalCount,
    sectionScores,
  };
}

module.exports = {
  getAnswerValue,
  calculateAssessmentScore,
};