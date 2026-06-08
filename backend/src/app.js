const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const ssoRoutes = require('./routes/sso.routes');
const adminFrameworkRoutes = require('./routes/adminFramework.routes');
const adminSeedRoutes = require('./routes/adminSeed.routes');
const authRoutes = require('./routes/auth.routes');
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
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());

app.use(helmet());
app.use(morgan('dev'));

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

app.use('/auth/login', strictLimiter);
app.use('/demo-requests', strictLimiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/', dashboardRoutes);
app.use('/demo-requests', demoRequestRoutes);
app.use('/onboarding', onboardingRoutes);
app.use('/companies', companyRoutes);
app.use('/controls', controlRoutes);
app.use('/frameworks', frameworkRoutes);
app.use('/admin', adminFrameworkRoutes);
app.use('/admin', adminSeedRoutes);
app.use('/', evidenceRoutes);
app.use('/', reportRoutes);
app.use('/tasks', taskRoutes);
app.use('/auth/sso', ssoRoutes);
app.use('/vendors', vendorRoutes);
app.use('/systems', systemRoutes);
app.use('/business-processes', businessProcessRoutes);
app.use('/dependencies', dependencyRoutes);

app.use(errorHandler);

module.exports = app;