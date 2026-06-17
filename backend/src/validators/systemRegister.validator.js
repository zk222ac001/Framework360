const { z } = require('zod');

const criticalityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const recordIdSchema = z.union([z.string().min(1), z.number().int().positive()])
  .transform((value) => String(value));

const systemAssetTypeEnum = z.enum([
  'APPLICATION',
  'DATABASE',
  'INFRASTRUCTURE',
  'CLOUD_SERVICE',
  'SAAS',
  'API',
  'WEBSITE',
  'IDENTITY_PROVIDER',
  'SECURITY_TOOL',
  'BACKUP_SYSTEM',
  'EMAIL_SYSTEM',
  'ERP',
  'CRM',
  'HR_SYSTEM',
  'PAYMENT_SYSTEM',
  'OTHER',
]);

const systemAssetStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'PLANNED',
  'RETIRED',
]);

const dependencyNodeTypeEnum = z.enum([
  'SYSTEM',
  'VENDOR',
  'BUSINESS_PROCESS',
]);

const dependencyTypeEnum = z.enum([
  'AUTHENTICATION',
  'HOSTING',
  'DATA',
  'EMAIL',
  'BACKUP',
  'PAYMENT',
  'NETWORK',
  'MANUAL_PROCESS',
  'OTHER',
]);

const vendorSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(1000).optional().nullable(),
  website: z.string().max(255).optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  criticality: criticalityEnum.optional(),
  isCriticalSupplier: z.boolean().optional(),
  hasDpa: z.boolean().optional(),
  hasSla: z.boolean().optional(),
  hasSecurityReview: z.boolean().optional(),
  country: z.string().max(100).optional().nullable(),
  reviewDate: z.string().min(1).optional().nullable(),
}).strict();

const updateVendorSchema = vendorSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

const systemAssetSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(1000).optional().nullable(),
  type: systemAssetTypeEnum.optional(),
  criticality: criticalityEnum.optional(),
  ownerDepartment: z.string().max(150).optional().nullable(),
  ownerUserId: recordIdSchema.optional().nullable(),
  vendorId: recordIdSchema.optional().nullable(),
  containsPersonalData: z.boolean().optional(),
  containsSensitiveData: z.boolean().optional(),
  internetExposed: z.boolean().optional(),
  mfaEnabled: z.boolean().optional(),
  backupEnabled: z.boolean().optional(),
  loggingEnabled: z.boolean().optional(),
  monitoringEnabled: z.boolean().optional(),
  rtoMinutes: z.number().int().nonnegative().optional().nullable(),
  rpoMinutes: z.number().int().nonnegative().optional().nullable(),
  status: systemAssetStatusEnum.optional(),
}).strict();

const updateSystemAssetSchema = systemAssetSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

const businessProcessSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(1000).optional().nullable(),
  ownerDepartment: z.string().max(150).optional().nullable(),
  criticality: criticalityEnum.optional(),
  maxTolerableDowntimeMinutes: z.number().int().nonnegative().optional().nullable(),
  manualWorkaroundAvailable: z.boolean().optional(),
}).strict();

const updateBusinessProcessSchema = businessProcessSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

const dependencySchema = z.object({
  sourceType: dependencyNodeTypeEnum,
  sourceId: recordIdSchema,
  targetType: dependencyNodeTypeEnum,
  targetId: recordIdSchema,
  dependencyType: dependencyTypeEnum.optional(),
  isCritical: z.boolean().optional(),
  failureImpact: z.string().max(1000).optional().nullable(),
  manualWorkaroundAvailable: z.boolean().optional(),
  notes: z.string().max(1000).optional().nullable(),
}).strict();

const updateDependencySchema = dependencySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

module.exports = {
  vendorSchema,
  updateVendorSchema,
  systemAssetSchema,
  updateSystemAssetSchema,
  businessProcessSchema,
  updateBusinessProcessSchema,
  dependencySchema,
  updateDependencySchema,
};
