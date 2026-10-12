import {Router} from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { apiLimiter } from '../../core/middleware/rateLimiter.js';
import { loadWorkspace } from '../workspace/workspace.middleware.js';
import { validateObjectId } from '../../core/middleware/validateObjectId.js';
import {
  getWorkspaceStatsController,
  getProjectStatsController,
} from './analytics.controller.js';

const router = Router({ mergeParams: true });

router.use(authenticate, apiLimiter);
router.use(validateObjectId('workspaceId'));
router.use(loadWorkspace);

router.get('/stats', getWorkspaceStatsController);

router.get(
  '/projects/:projectId/stats',
  validateObjectId('projectId'),
  getProjectStatsController,
);

export { router as analyticsRouter };

