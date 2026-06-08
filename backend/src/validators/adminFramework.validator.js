const { z } = require('zod');

const frameworkCodeEnum = z.enum([
  'GDPR',
  'NIS2',
  'DORA',
  'AI_ACT',
  'CRA',
  'DATA_ACT',
  'EIDAS',
  'CER',
  'ISO27001',
  'ISO27002',
  'ISO27701',
  'ISO22301',
  'ISO42001',
  'SOC2',
  'CIS_CONTROLS',
  'NIST_CSF',
  'PCI_DSS',
  'TISAX',
  'D_MAERKET',
]);

const createFrameworkSchema = z.object({
  code: frameworkCodeEnum,
  name: z.string().min(1, 'Framework name is required'),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

const updateFrameworkSchema = z.object({
  name: z.string().min(1, 'Framework name is required').optional(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

const createSectionSchema = z.object({
  title: z.string().min(1, 'Section title is required'),
  description: z.string().optional().nullable(),
  order: z.number().int().positive(),
  weight: z.number().int().positive().optional(),
});

const updateSectionSchema = z.object({
  title: z.string().min(1, 'Section title is required').optional(),
  description: z.string().optional().nullable(),
  order: z.number().int().positive().optional(),
  weight: z.number().int().positive().optional(),
});

const createRequirementSchema = z.object({
  question: z.string().min(1, 'Requirement question is required'),
  description: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  implementationGuide: z.string().optional().nullable(),
  exampleEvidence: z.string().optional().nullable(),
  riskIfMissing: z.string().optional().nullable(),
  order: z.number().int().positive(),
  weight: z.number().int().positive().optional(),
  isRequired: z.boolean().optional(),
});

const updateRequirementSchema = z.object({
  question: z.string().min(1, 'Requirement question is required').optional(),
  description: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  implementationGuide: z.string().optional().nullable(),
  exampleEvidence: z.string().optional().nullable(),
  riskIfMissing: z.string().optional().nullable(),
  order: z.number().int().positive().optional(),
  weight: z.number().int().positive().optional(),
  isRequired: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

module.exports = {
  createFrameworkSchema,
  updateFrameworkSchema,
  createSectionSchema,
  updateSectionSchema,
  createRequirementSchema,
  updateRequirementSchema,
};