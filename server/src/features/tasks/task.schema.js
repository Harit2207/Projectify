import { z } from 'zod';
import { STATUSES, PRIORITIES } from './tasks.model.js';

const dueDateValidator = z
  .string()
  .datetime()
  .optional()
  .nullable()
  .refine(
    (val) => {
      if (!val) return true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(val) >= today;
    },
    { message: 'Due date cannot be in the past' },
  );

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Title required').max(255),
    description: z.string().max(5000).optional().default(''),
    status: z.enum(STATUSES).optional().default('todo'),
    priority: z.enum(PRIORITIES).optional().default('none'),
    epicId: z.string().optional().nullable(),
    assignees: z.array(z.string()).optional().default([]),
    dueDate: dueDateValidator,
    labels: z.array(z.string().max(30)).optional().default([]),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({ taskId: z.string().min(1) }),
  body: z.object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().max(5000).optional(),
    status: z.enum(STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    epicId: z.string().optional().nullable(),
    assignees: z.array(z.string()).optional(),
    dueDate: dueDateValidator,
    labels: z.array(z.string().max(30)).optional(),
  }),
});

export const reorderTasksSchema = z.object({
  body: z.object({
    updates: z.array(
      z.object({
        taskId: z.string().min(1),
        status: z.enum(STATUSES),
        position: z.number(),
      }),
    ).min(1),
    projectId: z.string().min(1),
  }),
});

export const getTasksSchema = z.object({
  query: z.object({
    status: z.enum(STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    assignee: z.string().optional(),
    epicId: z.string().optional(),
    search: z.string().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});
