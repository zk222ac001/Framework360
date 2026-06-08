const express = require('express');

const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  return res.json({
    message: 'Controls module is deprecated. Use framework requirements, evidence, gaps, action plans, and tasks instead.',
    replacementEndpoints: [
      'GET /frameworks/:code/assessment',
      'PATCH /frameworks/assessments/:assessmentId/answers',
      'GET /frameworks/assessments/:assessmentId/gaps',
      'GET /frameworks/assessments/:assessmentId/action-plan',
      'GET /tasks',
    ],
  });
});

router.post('/init', async (req, res) => {
  return res.status(410).json({
    error: 'Controls module is deprecated',
    message: 'Use framework assessments instead.',
  });
});

router.patch('/:id', async (req, res) => {
  return res.status(410).json({
    error: 'Controls module is deprecated',
    message: 'Use framework requirement answers instead.',
  });
});

module.exports = router;