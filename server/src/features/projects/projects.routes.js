import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { validate } from '../../core/middleware/validate.js';
import { apiLimiter } from '../../core/middleware/rateLimiter.js';
import { loadWorkspace, requireWorkspaceRole } from '../workspace/workspace.middleware.js';
import { validateObjectId } from '../../core/middleware/validateObjectId.js';
import {
  createProjectSchema,
  updateProjectSchema,
  createEpicSchema,
  updateEpicSchema,
} from './projects.schema.js';
import {
  getProjectsController,
  createProjectController,
  getProjectController,
  updateProjectController,
  deleteProjectController,
  getEpicsController,
  createEpicController,
  updateEpicController,
  deleteEpicController,
} from './project.controller.js';

const router = Router({ mergeParams: true }); 

router.use(authenticate, apiLimiter);
router.use(validateObjectId('workspaceId'));
router.use(loadWorkspace);

// ── Projects ──────────────────────────────────────────────────────
router.get('/', getProjectsController);

router.post(
  '/',
  requireWorkspaceRole('owner', 'admin', 'member'),
  validate(createProjectSchema),
  createProjectController,
);

router.get(
  '/:projectId',
  validateObjectId('projectId'),
  getProjectController,
);

router.patch(
  '/:projectId',
  validateObjectId('projectId'),
  validate(updateProjectSchema),
  updateProjectController,
);

router.delete(
  '/:projectId',
  validateObjectId('projectId'),
  requireWorkspaceRole('owner', 'admin'),
  deleteProjectController,
);

// ── Epics ─────────────────────────────────────────────────────────
router.get(
  '/:projectId/epics',
  validateObjectId('projectId'),
  getEpicsController,
);

router.post(
  '/:projectId/epics',
  validateObjectId('projectId'),
  requireWorkspaceRole('owner', 'admin'),
  validate(createEpicSchema),
  createEpicController,
);

router.patch(
  '/:projectId/epics/:epicId',
  validateObjectId('projectId', 'epicId'),
  validate(updateEpicSchema),
  updateEpicController,
);

router.delete(
  '/:projectId/epics/:epicId',
  validateObjectId('projectId', 'epicId'),
  requireWorkspaceRole('owner', 'admin'),
  deleteEpicController,
);

export { router as projectRouter };


