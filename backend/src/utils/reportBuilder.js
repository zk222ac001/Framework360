const PDFDocument = require('pdfkit');

function buildAssessmentReport(res, assessment, actionPlan) {
  const doc = new PDFDocument({ margin: 40 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=assessment-${assessment.id}.pdf`
  );

  doc.pipe(res);

  doc.fontSize(20).text('Compliance Report', { align: 'center' });
  doc.moveDown();

  if (assessment.company) {
    doc.fontSize(12).text(`Company: ${assessment.company.name}`);
    if (assessment.company.cvr) {
      doc.text(`CVR: ${assessment.company.cvr}`);
    }
    if (assessment.company.country) {
      doc.text(`Country: ${assessment.company.country}`);
    }
    doc.moveDown();
  }

  doc.fontSize(12).text(`Framework: ${assessment.frameworkDefinition.name}`);
  doc.text(`Framework code: ${assessment.frameworkDefinition.code}`);
  doc.text(`Score: ${assessment.score}%`);
  doc.text(`Status: ${assessment.status}`);
  doc.text(`Generated: ${new Date().toISOString().slice(0, 10)}`);
  doc.moveDown();

  doc.fontSize(16).text('Requirements');
  doc.moveDown();

  for (const section of assessment.frameworkDefinition.sections) {
    doc.fontSize(14).text(section.title);
    doc.moveDown(0.5);

    for (const requirement of section.requirements) {
      const answer = assessment.answers.find(
        (item) => item.requirementId === requirement.id
      );

      const evidence = answer?.evidence || [];

      doc.fontSize(11).text(`Requirement: ${requirement.question}`);
      doc.text(`Reference: ${requirement.reference || 'N/A'}`);
      doc.text(`Status: ${answer?.status || 'UNANSWERED'}`);
      doc.text(`Note: ${answer?.note || 'N/A'}`);
      doc.text(`Description: ${requirement.description || 'N/A'}`);
      doc.text(
        `How to implement: ${
          requirement.implementationGuide || 'No guidance available'
        }`
      );
      doc.text(`Example evidence: ${requirement.exampleEvidence || 'N/A'}`);
      doc.text(`Risk if missing: ${requirement.riskIfMissing || 'N/A'}`);
      doc.text(`Evidence uploaded: ${evidence.length}`);

      if (evidence.length > 0) {
        for (const item of evidence) {
          doc.text(`- ${item.filename}`);
        }
      }

      doc.moveDown();
    }

    doc.moveDown();
  }

  if (actionPlan) {
    doc.addPage();
    doc.fontSize(16).text('Action Plan');
    doc.moveDown();

    const groups = [
      ['High priority', actionPlan.highPriority || []],
      ['Medium priority', actionPlan.mediumPriority || []],
      ['Low priority', actionPlan.lowPriority || []],
    ];

    for (const [title, items] of groups) {
      if (!items.length) continue;

      doc.fontSize(14).text(title);
      doc.moveDown(0.5);

      for (const item of items) {
        doc.fontSize(11).text(`- ${item.title}`);
        doc.text(`Status: ${item.status || 'N/A'}`);
        doc.text(`Action: ${item.action || 'N/A'}`);
        doc.text(`Risk: ${item.risk || 'N/A'}`);
        doc.text(`Evidence needed: ${item.evidenceNeeded || 'N/A'}`);
        doc.moveDown();
      }

      doc.moveDown();
    }
  }

  doc.end();
}

function buildExecutiveComplianceReport(res, payload) {
  const doc = new PDFDocument({ margin: 44 });
  const companyName = payload.company?.name || 'company';

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=framework360-executive-report-${companyName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`
  );

  doc.pipe(res);
  doc.fontSize(24).text('Framework360 Executive Compliance Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Company: ${companyName}`);
  doc.text(`Generated: ${new Date().toISOString().slice(0, 10)}`);
  if (payload.company?.country) doc.text(`Country: ${payload.company.country}`);
  if (payload.company?.sector) doc.text(`Sector: ${payload.company.sector}`);
  doc.moveDown();

  doc.fontSize(16).text('Executive Snapshot');
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Average readiness: ${payload.overall.averageScore}%`);
  doc.text(`Frameworks tracked: ${payload.overall.totalFrameworks}`);
  doc.text(`Completed frameworks: ${payload.overall.completedFrameworks}`);
  doc.text(`Open gaps: ${payload.overall.totalGaps}`);
  doc.text(`Evidence files: ${payload.evidenceAnalytics.totalEvidence}`);
  doc.text(`Vendors registered: ${payload.vendorRisk.totalVendors}`);
  doc.moveDown();

  doc.fontSize(16).text('Framework Readiness');
  doc.moveDown(0.5);
  for (const framework of payload.frameworks) {
    doc.fontSize(11).text(`${framework.name}: ${Math.round(framework.score)}% (${framework.status})`);
    doc.text(`Open gaps: ${framework.gapsCount || 0}`);
    doc.moveDown(0.35);
  }

  doc.addPage();
  doc.fontSize(16).text('Top Remediation Actions');
  doc.moveDown(0.5);
  if (!payload.topActions.length) {
    doc.fontSize(11).text('No prioritized remediation actions at this time.');
  }
  for (const action of payload.topActions) {
    doc.fontSize(11).text(`${action.priority}: ${action.title}`);
    doc.text(`Framework: ${action.framework}`);
    doc.text(`Section: ${action.section}`);
    doc.text(`Evidence needed: ${action.evidenceNeeded || 'N/A'}`);
    doc.moveDown();
  }

  doc.fontSize(16).text('Vendor Risk');
  doc.moveDown(0.5);
  doc.fontSize(11).text(`Critical: ${payload.vendorRisk.matrix.critical}`);
  doc.text(`High: ${payload.vendorRisk.matrix.high}`);
  doc.text(`Medium: ${payload.vendorRisk.matrix.medium}`);
  doc.text(`Low: ${payload.vendorRisk.matrix.low}`);
  doc.moveDown();
  for (const vendor of payload.vendorRisk.criticalVendors) {
    doc.text(`${vendor.name}: ${vendor.criticality} (${vendor.riskScore})`);
  }

  doc.addPage();
  doc.fontSize(16).text('AI Recommendations');
  doc.moveDown(0.5);
  if (!payload.aiRecommendations.length) {
    doc.fontSize(11).text('No recommendations available yet.');
  }
  for (const recommendation of payload.aiRecommendations) {
    doc.fontSize(11).text(`${recommendation.priority}: ${recommendation.title}`);
    doc.text(recommendation.description);
    doc.moveDown();
  }

  doc.end();
}

function buildAssessmentReportPdf(assessment, res) {
  return buildAssessmentReport(res, assessment, null);
}

module.exports = {
  buildAssessmentReport,
  buildAssessmentReportPdf,
  buildExecutiveComplianceReport,
};
