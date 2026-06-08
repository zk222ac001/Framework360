const { z } = require('zod');

const taskStatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'DONE']);
const taskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);

const createTaskSchema = z.object({
  assessmentId: z.number().int().positive().optional().nullable(),
  requirementId: z.number().int().positive().optional().nullable(),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional().nullable(),
  priority: taskPriorityEnum.optional(),
  assignedToUserId: z.number().int().positive().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').optional(),
  description: z.string().optional().nullable(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  assignedToUserId: z.number().int().positive().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
};