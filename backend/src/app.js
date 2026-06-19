const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const ssoRoutes = require('./routes/sso.routes');
const adminFrameworkRoutes = require('./routes/adminFramework.routes');
const adminSeedRoutes = require('./routes/adminSeed.routes');
const auditLogRoutes = require('./routes/auditLog.routes');
const authRoutes = require('./routes/auth.routes');
const billingRoutes = require('./routes/billing.routes');
const companyRoutes = require('./routes/company.routes');
const controlRoutes = require('./routes/control.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const demoRequestRoutes = require('./routes/demoRequest.routes');
const evidenceRoutes = require('./routes/evidence.routes');
const frameworkRoutes = require('./routes/framework.routes');
const onboardingRoutes = require('./routes/onboarding.routes');
const reportRoutes = require('./routes/report.routes');
const taskRoutes = require('./routes/task.routes');
const vendorRoutes = require('./routes/vendor.routes');
const systemRoutes = require('./routes/system.routes');
const businessProcessRoutes = require('./routes/businessProcess.routes');
const dependencyRoutes = require('./routes/dependency.routes');
const auditFindingsRoutes = require('./routes/auditFindings.routes');
const evidenceCampaignRoutes = require('./routes/evidenceCampaign.routes');
const approvalRoutes = require('./routes/approval.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const prisma = require('./db');
const { requestContext } = require('./middleware/requestContext.middleware');
const { requestLogger } = require('./middleware/requestLogger.middleware');
const { requireActiveSubscription } = require('./middleware/subscription.middleware');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(requestContext);
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// Stripe webhooks must receive the raw request body for signature verification.
app.use('/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use(helmet());
app.use(requestLogger);

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

app.use('/auth/login', strictLimiter);
app.use('/demo-requests', strictLimiter);
app.use('/billing/checkout-session', strictLimiter);

app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    requestId: req.requestId,
    database: 'unknown',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = 'connected';
    return res.json(health);
  } catch (error) {
    health.status = 'degraded';
    health.database = 'disconnected';
    return res.status(503).json(health);
  }
});

app.use('/auth', authRoutes);
app.use('/demo-requests', demoRequestRoutes);
app.use('/subscription', subscriptionRoutes);
app.use('/billing', billingRoutes);
app.use(requireActiveSubscription);
app.use('/', dashboardRoutes);
app.use('/onboarding', onboardingRoutes);
app.use('/companies', companyRoutes);
app.use('/controls', controlRoutes);
app.use('/frameworks', frameworkRoutes);
app.use('/admin', adminFrameworkRoutes);
app.use('/admin', adminSeedRoutes);
app.use('/audit-logs', auditLogRoutes);
app.use('/', evidenceRoutes);
app.use('/', reportRoutes);
app.use('/', auditFindingsRoutes);
app.use('/', evidenceCampaignRoutes);
app.use('/', approvalRoutes);
app.use('/tasks', taskRoutes);
app.use('/auth/sso', ssoRoutes);
app.use('/vendors', vendorRoutes);
app.use('/systems', systemRoutes);
app.use('/business-processes', businessProcessRoutes);
app.use('/dependencies', dependencyRoutes);

app.use(errorHandler);

module.exports = app;
