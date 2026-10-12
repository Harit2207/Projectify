import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name required').max(100),
    description: z.string().max(500).optional().default(''),
    emoji: z.string().emoji('Invalid emoji').optional().default('📋'),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({ projectId: z.string().min(1) }),
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    status: z.enum(['active', 'archived', 'completed']).optional(),
    emoji: z.string().optional(),
  }),
});

export const createEpicSchema = z
  .object({
    body: z.object({
      title: z.string().trim().min(1, 'Title required').max(150),
      description: z.string().max(1000).optional().default(''),
      color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color')
        .optional()
        .default('#6366f1'),
      startDate: z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')]).optional().nullable(),
      endDate: z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')]).optional().nullable(),
    }),
  })
  .refine(
    ({ body }) => {
      if (!body.startDate) return true;
      const start = new Date(body.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return start >= today;
    },
    {
      message: 'Start date cannot be in the past',
      path: ['body', 'startDate'],
    },
  )
  .refine(
    ({ body }) => {
      if (!body.endDate) return true;
      const end = new Date(body.endDate);
      const minDate = body.startDate ? new Date(body.startDate) : new Date();
      minDate.setHours(0, 0, 0, 0);
      return end >= minDate;
    },
    {
      message: 'End date cannot be before start date',
      path: ['body', 'endDate'],
    },
  );

export const updateEpicSchema = z.object({
  params: z.object({ epicId: z.string().min(1) }),
  body: z.object({
    title: z.string().trim().min(1).max(150).optional(),
    description: z.string().max(1000).optional(),
    status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
  }),
});
