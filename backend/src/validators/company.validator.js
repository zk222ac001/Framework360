const { z } = require('zod');

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  cvr: z.string().optional().nullable(),
  sector: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
});

const updateMyCompanySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  cvr: z.string().min(2).max(50).optional().nullable(),
  sector: z.string().min(2).max(100).optional().nullable(),
  country: z.string().min(2).max(100).optional().nullable(),
}).strict();

module.exports = {
  companySchema,updateMyCompanySchema,
};