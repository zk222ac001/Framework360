const express = require('express');
const { z } = require('zod');

const prisma = require('../db');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { getCompanyId, requireWriteAccess } = require('../utils/systemRegisterAccess');

const router = express.Router();

const createQuestionnaireSchema = z.object({
  title: z.string().min(1).max(180),
  requester: z.string().max(180).optional().nullable(),
  source: z.string().max(120).optional().nullable(),
  questions: z.array(z.string().min(1).max(1000)).min(1).max(200),
}).strict();

const updateQuestionSchema = z.object({
  answer: z.string().max(4000).optional().nullable(),
  status: z.enum(['UNANSWERED', 'GENERATED', 'REVIEWED', 'APPROVED']).optional(),
}).strict();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;

    const questionnaires = await prisma.securityQuestionnaire.findMany({
      where: { companyId },
      include: {
        questions: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json({ questionnaires: questionnaires.map(mapQuestionnaire) });
  } catch (error) {
    console.error('GET /questionnaires error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.post('/', validate(createQuestionnaireSchema), async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;
    if (!requireWriteAccess(req, res)) return;

    const questionnaire = await prisma.securityQuestionnaire.create({
      data: {
        companyId,
        title: req.body.title,
        requester: req.body.requester || null,
        source: req.body.source || null,
        questions: {
          create: req.body.questions.map((question) => ({
            question,
            category: inferQuestionCategory(question),
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return res.status(201).json({ questionnaire: mapQuestionnaire(questionnaire) });
  } catch (error) {
    console.error('POST /questionnaires error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.post('/:id/generate', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;
    if (!requireWriteAccess(req, res)) return;

    const questionnaire = await prisma.securityQuestionnaire.findFirst({
      where: { id: req.params.id, companyId },
      include: {
        questions: true,
      },
    });

    if (!questionnaire) {
      return res.status(404).json({ error: 'Security questionnaire not found' });
    }

    const context = await loadCompanyAnswerContext(companyId);

    for (const question of questionnaire.questions) {
      const generated = generateAnswer(question.question, context);
      await prisma.securityQuestionnaireQuestion.update({
        where: { id: question.id },
        data: {
          category: generated.category,
          answer: generated.answer,
          confidence: generated.confidence,
          sourceRefs: generated.sourceRefs,
          status: 'GENERATED',
        },
      });
    }

    const updated = await prisma.securityQuestionnaire.update({
      where: { id: questionnaire.id },
      data: { status: 'GENERATED' },
      include: { questions: true },
    });

    return res.json({ questionnaire: mapQuestionnaire(updated) });
  } catch (error) {
    console.error('POST /questionnaires/:id/generate error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.patch('/:id/questions/:questionId', validate(updateQuestionSchema), async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;
    if (!requireWriteAccess(req, res)) return;

    const question = await prisma.securityQuestionnaireQuestion.findFirst({
      where: {
        id: req.params.questionId,
        questionnaire: {
          id: req.params.id,
          companyId,
        },
      },
    });

    if (!question) {
      return res.status(404).json({ error: 'Questionnaire question not found' });
    }

    const updated = await prisma.securityQuestionnaireQuestion.update({
      where: { id: question.id },
      data: {
        ...(req.body.answer !== undefined ? { answer: req.body.answer } : {}),
        ...(req.body.status !== undefined ? { status: req.body.status } : {}),
      },
    });

    return res.json({ question: mapQuestion(updated) });
  } catch (error) {
    console.error('PATCH /questionnaires/:id/questions/:questionId error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const companyId = getCompanyId(req, res);
    if (!companyId) return;
    if (!requireWriteAccess(req, res)) return;

    const existing = await prisma.securityQuestionnaire.findFirst({
      where: { id: req.params.id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Security questionnaire not found' });
    }

    await prisma.securityQuestionnaire.delete({ where: { id: existing.id } });

    return res.json({ message: 'Security questionnaire deleted' });
  } catch (error) {
    console.error('DELETE /questionnaires/:id error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

async function loadCompanyAnswerContext(companyId) {
  return prisma.company.findUnique({
    where: { id: companyId },
    include: {
      frameworks: true,
      controls: {
        include: { evidence: true },
      },
      evidence: true,
      systems: true,
      vendors: true,
      trustCenterProfile: true,
      trustCenterDocuments: true,
    },
  });
}

function generateAnswer(questionText, company) {
  const question = questionText.toLowerCase();
  const frameworks = (company.frameworks || [])
    .filter((framework) => framework.enabled !== false)
    .map((framework) => framework.framework);
  const controls = company.controls || [];
  const evidence = company.evidence || [];
  const systems = company.systems || [];
  const vendors = company.vendors || [];
  const implementedControls = controls.filter((control) =>
    control.status === 'IMPLEMENTED' || control.status === 'NOT_APPLICABLE'
  );
  const readiness = controls.length
    ? Math.round((implementedControls.length / controls.length) * 100)
    : 0;

  if (containsAny(question, ['soc 2', 'iso', 'gdpr', 'nis2', 'dora', 'framework', 'certification', 'compliance'])) {
    return answer({
      category: 'COMPLIANCE',
      confidence: frameworks.length ? 'HIGH' : 'MEDIUM',
      answer: `${company.name} tracks ${frameworks.length ? frameworks.join(', ') : 'selected compliance frameworks'} in Framework360. Current readiness is ${readiness}% across ${controls.length} tracked controls, with ${evidence.length} evidence item(s) available for review.`,
      sourceRefs: frameworks.map((framework) => ({ type: 'FRAMEWORK', id: framework })),
    });
  }

  if (containsAny(question, ['mfa', 'access', 'identity', 'password', 'privileged'])) {
    const mfaCoverage = percent(systems.filter((system) => system.mfaEnabled).length, systems.length);
    const exposedWithoutMfa = systems.filter((system) => system.internetExposed && !system.mfaEnabled);
    return answer({
      category: 'ACCESS_CONTROL',
      confidence: systems.length ? 'HIGH' : 'MEDIUM',
      answer: `${company.name} tracks access controls through system inventory and framework controls. ${mfaCoverage}% of registered systems have MFA marked as enabled. ${exposedWithoutMfa.length} internet-exposed system(s) still need MFA remediation evidence.`,
      sourceRefs: systems.slice(0, 6).map((system) => ({ type: 'SYSTEM', id: system.id, name: system.name })),
    });
  }

  if (containsAny(question, ['vendor', 'supplier', 'third party', 'third-party', 'subprocessor'])) {
    const criticalVendors = vendors.filter((vendor) => vendor.criticality === 'CRITICAL' || vendor.isCriticalSupplier);
    const reviewed = vendors.filter((vendor) => vendor.hasSecurityReview);
    return answer({
      category: 'VENDOR_RISK',
      confidence: vendors.length ? 'HIGH' : 'MEDIUM',
      answer: `${company.name} maintains ${vendors.length} vendor record(s), including ${criticalVendors.length} critical supplier(s). ${reviewed.length} vendor(s) have security review evidence marked, and DPA/SLA status is tracked for critical suppliers.`,
      sourceRefs: vendors.slice(0, 6).map((vendor) => ({ type: 'VENDOR', id: vendor.id, name: vendor.name })),
    });
  }

  if (containsAny(question, ['backup', 'disaster', 'continuity', 'rto', 'rpo', 'availability'])) {
    const backupCoverage = percent(systems.filter((system) => system.backupEnabled).length, systems.length);
    const criticalMissingRto = systems.filter((system) => system.criticality === 'CRITICAL' && system.rtoMinutes === null);
    return answer({
      category: 'BUSINESS_CONTINUITY',
      confidence: systems.length ? 'HIGH' : 'MEDIUM',
      answer: `${company.name} tracks business continuity controls in the system register. Backup coverage is ${backupCoverage}% across registered systems. ${criticalMissingRto.length} critical system(s) are missing RTO documentation.`,
      sourceRefs: systems.slice(0, 6).map((system) => ({ type: 'SYSTEM', id: system.id, name: system.name })),
    });
  }

  if (containsAny(question, ['logging', 'monitoring', 'incident', 'alert', 'detect'])) {
    const loggingCoverage = percent(systems.filter((system) => system.loggingEnabled).length, systems.length);
    const monitoringCoverage = percent(systems.filter((system) => system.monitoringEnabled).length, systems.length);
    return answer({
      category: 'MONITORING',
      confidence: systems.length ? 'HIGH' : 'MEDIUM',
      answer: `${company.name} tracks logging and monitoring status per registered system. Logging coverage is ${loggingCoverage}% and monitoring coverage is ${monitoringCoverage}%. Critical gaps are surfaced in the AI copilot and system security gap analysis.`,
      sourceRefs: systems.slice(0, 6).map((system) => ({ type: 'SYSTEM', id: system.id, name: system.name })),
    });
  }

  if (containsAny(question, ['policy', 'policies', 'procedure', 'document'])) {
    const documents = company.trustCenterDocuments || [];
    return answer({
      category: 'POLICIES',
      confidence: documents.length ? 'HIGH' : 'MEDIUM',
      answer: `${company.name} manages policies and trust documents in Framework360. ${documents.length} trust center document(s) are registered, and the AI policy generator can draft security, privacy, vendor, access, incident, and continuity policies from workspace data.`,
      sourceRefs: documents.slice(0, 6).map((document) => ({ type: 'TRUST_DOCUMENT', id: document.id, title: document.title })),
    });
  }

  return answer({
    category: inferQuestionCategory(questionText),
    confidence: controls.length || evidence.length ? 'MEDIUM' : 'LOW',
    answer: `${company.name} manages compliance evidence, controls, vendors, systems, tasks, and audit readiness in Framework360. The current workspace contains ${controls.length} control(s), ${evidence.length} evidence item(s), ${systems.length} system(s), and ${vendors.length} vendor(s). Please review and tailor this response before sending externally.`,
    sourceRefs: [],
  });
}

function answer({ category, confidence, answer, sourceRefs }) {
  return {
    category,
    confidence,
    answer,
    sourceRefs,
  };
}

function inferQuestionCategory(questionText) {
  const question = questionText.toLowerCase();
  if (containsAny(question, ['mfa', 'access', 'identity', 'password'])) return 'ACCESS_CONTROL';
  if (containsAny(question, ['vendor', 'supplier', 'third party', 'subprocessor'])) return 'VENDOR_RISK';
  if (containsAny(question, ['incident', 'logging', 'monitoring', 'alert'])) return 'MONITORING';
  if (containsAny(question, ['privacy', 'gdpr', 'personal data', 'retention'])) return 'PRIVACY';
  if (containsAny(question, ['backup', 'continuity', 'availability', 'rto', 'rpo'])) return 'BUSINESS_CONTINUITY';
  if (containsAny(question, ['policy', 'procedure', 'document'])) return 'POLICIES';
  return 'GENERAL';
}

function containsAny(text, values) {
  return values.some((value) => text.includes(value));
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function mapQuestionnaire(questionnaire) {
  const questions = questionnaire.questions || [];

  return {
    id: questionnaire.id,
    title: questionnaire.title,
    requester: questionnaire.requester,
    status: questionnaire.status,
    source: questionnaire.source,
    totalQuestions: questions.length,
    answeredQuestions: questions.filter((question) => Boolean(question.answer)).length,
    createdAt: questionnaire.createdAt,
    updatedAt: questionnaire.updatedAt,
    questions: questions.map(mapQuestion),
  };
}

function mapQuestion(question) {
  return {
    id: question.id,
    question: question.question,
    category: question.category,
    answer: question.answer,
    confidence: question.confidence,
    sourceRefs: question.sourceRefs || [],
    status: question.status,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
  };
}

module.exports = router;
