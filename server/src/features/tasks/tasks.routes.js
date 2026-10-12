import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { validate } from '../../core/middleware/validate.js';
import { apiLimiter } from '../../core/middleware/rateLimiter.js';
import { loadWorkspace } from '../workspace/workspace.middleware.js';
import { validateObjectId } from '../../core/middleware/validateObjectId.js';
import {
  createTaskSchema,
  updateTaskSchema,
  reorderTasksSchema,
  getTasksSchema,
} from './task.schema.js';
import {
  getTasksController,
  getTasksGroupedController,
  createTaskController,
  getTaskController,
  updateTaskController,
  deleteTaskController,
  reorderTasksController,
  searchTasksController,
  paginatedSearchController,
} from './tasks.controller.js';

const router = Router({ mergeParams: true });

router.use(authenticate, apiLimiter);
router.use(validateObjectId('workspaceId'));
router.use(loadWorkspace);

// ── Workspace-level task routes ───────────────────────────────────
// These must be registered BEFORE /:projectId routes
// to prevent Express matching 'reorder' or 'search' as a projectId

router.post('/tasks/reorder', validate(reorderTasksSchema), reorderTasksController);
router.get('/tasks/search', searchTasksController);
router.get('/tasks/:taskId', validateObjectId('taskId'), getTaskController);
router.patch('/tasks/:taskId', validateObjectId('taskId'), validate(updateTaskSchema), updateTaskController);
router.delete('/tasks/:taskId', validateObjectId('taskId'), deleteTaskController);
router.get('/tasks/search/paginated', paginatedSearchController); 

// ── Project-scoped task routes ────────────────────────────────────
router.get(
  '/:projectId/tasks',
  validateObjectId('projectId'),
  validate(getTasksSchema),
  getTasksController,
);

router.get(
  '/:projectId/tasks/grouped',
  validateObjectId('projectId'),
  getTasksGroupedController,
);

router.post(
  '/:projectId/tasks',
  validateObjectId('projectId'),
  validate(createTaskSchema),
  createTaskController,
);

export { router as taskRouter };

