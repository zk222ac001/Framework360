const { z } = require('zod');

const taskStatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE']);
const taskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const recordIdSchema = z.union([z.string().min(1), z.number().int().positive()])
  .transform((value) => String(value));

const createTaskSchema = z.object({
  controlId: recordIdSchema.optional().nullable(),
  assessmentId: recordIdSchema.optional().nullable(),
  requirementId: recordIdSchema.optional().nullable(),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional().nullable(),
  priority: taskPriorityEnum.optional(),
  assignedToId: recordIdSchema.optional().nullable(),
  assignedToUserId: recordIdSchema.optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').optional(),
  description: z.string().optional().nullable(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  controlId: recordIdSchema.optional().nullable(),
  assignedToId: recordIdSchema.optional().nullable(),
  assignedToUserId: recordIdSchema.optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
};
