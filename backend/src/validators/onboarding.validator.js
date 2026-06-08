const { z } = require('zod');

const selectProductSchema = z.object({
  product: z.string().min(1, 'Product is required'),
});

const onboardingCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  cvr: z.string().optional().nullable(),
  sector: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
});

module.exports = {
  selectProductSchema,
  onboardingCompanySchema,
};