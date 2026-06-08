const { z } = require('zod');

const createDemoRequestSchema = z.object({
  email: z.string().email('Invalid email'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  jobTitle: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
});

const updateDemoRequestStatusSchema = z.object({
  status: z.enum(['PENDING', 'EMAILED', 'ACTIVATED', 'EXPIRED', 'REJECTED']),
});

module.exports = {
  createDemoRequestSchema,
  updateDemoRequestStatusSchema,
};