import { z } from 'zod';

export const testEmailSchema = z.object({
  body: z.object({
    to: z.string().email('Valid recipient email address is required'),
  }),
});
