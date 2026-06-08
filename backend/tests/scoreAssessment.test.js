const { calculateAssessmentScore } = require('../src/utils/scoreAssessment');

function buildAssessment(statuses) {
  return {
    frameworkDefinition: {
      sections: [
        {
          id: 1,
          weight: 1,
          requirements: statuses.map((status, index) => ({
            id: index + 1,
            weight: 1,
          })),
        },
      ],
    },
    answers: statuses.map((status, index) => ({
      requirementId: index + 1,
      status,
    })),
  };
}

describe('Score calculation', () => {
  it('YES should score 100', () => {
    const result = calculateAssessmentScore(buildAssessment(['YES']));
    expect(result.score).toBe(100);
  });

  it('PARTIAL should score 50', () => {
    const result = calculateAssessmentScore(buildAssessment(['PARTIAL']));
    expect(result.score).toBe(50);
  });

  it('NO should score 0', () => {
    const result = calculateAssessmentScore(buildAssessment(['NO']));
    expect(result.score).toBe(0);
  });

  it('NOT_APPLICABLE should be excluded', () => {
    const result = calculateAssessmentScore(buildAssessment(['YES', 'NOT_APPLICABLE']));
    expect(result.score).toBe(100);
  });

  it('mixed answers should calculate correctly', () => {
    const result = calculateAssessmentScore(buildAssessment(['YES', 'PARTIAL', 'NO']));
    expect(result.score).toBe(50);
  });
});