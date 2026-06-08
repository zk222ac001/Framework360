const { z } = require('zod');

const employeeCountValues = [
  'ONE_TO_NINE',
  'TEN_TO_FORTY_NINE',
  'FIFTY_TO_TWO_FORTY_NINE',
  'TWO_FIFTY_PLUS',
  'UNKNOWN',
];

const companyScopeSchema = z.object({
  employeeCount: z.enum(employeeCountValues).optional(),

  processesPersonalData: z.boolean().optional(),
  handlesSensitiveData: z.boolean().optional(),
  acceptsCardPayments: z.boolean().optional(),
  usesAiSystems: z.boolean().optional(),
  servesFinancialCustomers: z.boolean().optional(),
  isDigitalServiceProvider: z.boolean().optional(),
  operatesCriticalInfrastructure: z.boolean().optional(),
  hasEuCustomers: z.boolean().optional(),
  usesCloudProviders: z.boolean().optional(),
  hasCriticalSuppliers: z.boolean().optional(),
}).strict();

module.exports = {
  companyScopeSchema,
};