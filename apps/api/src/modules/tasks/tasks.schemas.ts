import { z } from 'zod';
import { TASK_PRIORITIES, TASK_STATUSES, type TaskRow } from '../../db/schema.js';

export const SORT_FIELDS = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title'] as const;
export const MAX_TAGS_PER_TASK = 10;

export const taskStatusSchema = z.enum(TASK_STATUSES);
export const taskPrioritySchema = z.enum(TASK_PRIORITIES);

const tagSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(30)
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'Tags may only contain letters, numbers and dashes');

const titleSchema = z.string().trim().min(1).max(200);
const descriptionSchema = z.string().trim().max(5000);
const dueDateSchema = z.iso.date().nullable().describe('Calendar date (YYYY-MM-DD) or null');
const tagsSchema = z.array(tagSchema).max(MAX_TAGS_PER_TASK);

export const createTaskBodySchema = z.object({
  title: titleSchema,
  description: descriptionSchema.default(''),
  status: taskStatusSchema.default('todo'),
  priority: taskPrioritySchema.default('medium'),
  dueDate: dueDateSchema.default(null),
  tags: tagsSchema.default([]),
});

export const updateTaskBodySchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema,
    status: taskStatusSchema,
    priority: taskPrioritySchema,
    dueDate: dueDateSchema,
    tags: tagsSchema,
  })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, {
    message: 'Provide at least one field to update',
  });

export const taskParamsSchema = z.object({ id: z.uuid() });

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  tags: z
    .string()
    .max(400)
    .optional()
    .describe('Comma-separated tags. A task must carry every listed tag to match.'),
  search: z
    .string()
    .trim()
    .max(200)
    .optional()
    .describe('Case-insensitive match on title or description'),
  dueFrom: z.iso.date().optional().describe('Due on or after this date'),
  dueTo: z.iso.date().optional().describe('Due on or before this date'),
  sort: z.enum(SORT_FIELDS).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const taskSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  dueDate: z.iso.date().nullable(),
  tags: z.array(z.string()),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const taskListResponseSchema = z.object({
  data: z.array(taskSchema),
  meta: z.object({
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export const tagListResponseSchema = z.object({
  data: z.array(z.object({ tag: z.string(), count: z.number().int() })),
});

export type CreateTaskInput = z.infer<typeof createTaskBodySchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskBodySchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type TaskDto = z.infer<typeof taskSchema>;

export function toTaskDto(task: TaskRow): TaskDto {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    tags: task.tags,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
