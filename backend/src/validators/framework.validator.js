const { z } = require('zod');

const saveAnswersSchema = z.object({
  answers: z.array(
    z.object({
      requirementId: z.number().int().positive(),
      status: z.enum(['YES', 'PARTIAL', 'NO', 'NOT_APPLICABLE']),
      note: z.string().optional().nullable(),
    })
  ).min(1),
});

module.exports = {
  saveAnswersSchema,
};