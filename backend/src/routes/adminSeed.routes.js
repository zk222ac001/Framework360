const express = require('express');
const fs = require('fs');
const path = require('path');

const prisma = require('../db');
const { requireAuth, requirePlatformAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);
router.use(requirePlatformAdmin);

const seedDir = path.join(process.cwd(), 'prisma', 'seed-data');

function getSeedFilePath(code) {
  const safeCode = code.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return path.join(seedDir, `${safeCode}.json`);
}

router.get('/seed-files', async (req, res) => {
  try {
    const files = fs
      .readdirSync(seedDir)
      .filter((file) => file.endsWith('.json'));

    return res.json({ files });
  } catch (error) {
    console.error('GET /admin/seed-files error:', error);

    return res.status(500).json({
      error: 'Could not fetch seed files',
      message: error.message,
    });
  }
});

router.get('/seed-files/:code', async (req, res) => {
  try {
    const filePath = getSeedFilePath(req.params.code);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Seed file not found' });
    }

    const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    return res.json(json);
  } catch (error) {
    console.error('GET /admin/seed-files/:code error:', error);

    return res.status(500).json({
      error: 'Could not read seed file',
      message: error.message,
    });
  }
});

router.put('/seed-files/:code', async (req, res) => {
  try {
    const filePath = getSeedFilePath(req.params.code);
    const payload = req.body;

    if (!payload.code || !payload.name || !Array.isArray(payload.sections)) {
      return res.status(400).json({
        error: 'Invalid seed structure',
      });
    }

    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');

    return res.json({
      message: 'Seed file updated',
      file: path.basename(filePath),
    });
  } catch (error) {
    console.error('PUT /admin/seed-files/:code error:', error);

    return res.status(500).json({
      error: 'Could not update seed file',
      message: error.message,
    });
  }
});

router.post('/seed-files/:code/import', async (req, res) => {
  try {
    const filePath = getSeedFilePath(req.params.code);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Seed file not found' });
    }

    return res.status(501).json({
      error: 'Framework seed import is not available in the current schema',
    });
  } catch (error) {
    console.error('POST /admin/seed-files/:code/import error:', error);

    return res.status(500).json({
      error: 'Could not import framework',
      message: error.message,
    });
  }
});

module.exports = router;
