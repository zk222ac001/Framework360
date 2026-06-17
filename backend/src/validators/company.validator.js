const { z } = require('zod');

const sectorValues = [
  'FINANCE',
  'INSURANCE',
  'BANKING',
  'HEALTHCARE',
  'PHARMA',
  'UTILITIES',
  'WATER',
  'TRANSPORT',
  'LOGISTICS',
  'IT',
  'TELECOM',
  'DIGITAL_INFRASTRUCTURE',
  'CLOUD',
  'PUBLIC',
  'GOVERNMENT',
  'MUNICIPAL',
  'MANUFACTURING',
  'INDUSTRIAL',
  'RETAIL',
  'ECOMMERCE',
  'EDUCATION',
  'MEDIA',
  'FOOD',
  'OTHER',
];

const countryValues = [
  'Denmark',
  'Sweden',
  'Germany',
  'Netherlands',
  'France',
];

const companyNameSchema = z
  .string()
  .trim()
  .min(2, 'Company name must be at least 2 characters')
  .max(100, 'Company name must be 100 characters or fewer')
  .regex(/\p{L}/u, 'Company name must include letters');

const cvrSchema = z
  .string()
  .trim()
  .regex(/^\d{8}$/, 'CVR must be exactly 8 digits');

const companySchema = z.object({
  name: companyNameSchema,
  cvr: cvrSchema.optional().nullable(),
  sector: z.enum(sectorValues, 'Invalid sector').optional().nullable(),
  country: z.enum(countryValues, 'Invalid country').optional().nullable(),
});

const updateMyCompanySchema = z.object({
  name: companyNameSchema.optional(),
  cvr: cvrSchema.optional(),
  sector: z.enum(sectorValues, 'Invalid sector').optional(),
  country: z.enum(countryValues, 'Invalid country').optional(),
}).strict();

module.exports = {
  companySchema,
  updateMyCompanySchema,
};
