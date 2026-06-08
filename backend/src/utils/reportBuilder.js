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

function buildAssessmentReportPdf(assessment, res) {
  return buildAssessmentReport(res, assessment, null);
}

module.exports = {
  buildAssessmentReport,
  buildAssessmentReportPdf,
};