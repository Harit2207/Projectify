import { Router } from 'express';
import { validate } from '../../core/middleware/validate.js';
import { testEmailSchema } from './debug.schema.js';
import { testEmail } from './debug.controller.js';

const router = Router();

router.post('/test-email', validate(testEmailSchema), testEmail);

export const debugRouter = router;
