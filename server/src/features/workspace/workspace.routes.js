import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { validate } from '../../core/middleware/validate.js';
import { apiLimiter } from '../../core/middleware/rateLimiter.js';

import {
  loadWorkspace,
  loadWorkspaceWithMembers,
  requireWorkspaceRole,
} from './workspace.middleware.js';

import {
  createSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
  workspaceParamsSchema,
  } from './workspace.schema.js';

import {
  createWorkspaceController,
  getUserWorkspacesController,
  getWorkspaceController,
  updateWorkspaceController,
  deleteWorkspaceController,
  inviteMemberController,
  updateMemberRoleController,
  removeMemberController,
  } from './workspace.controller.js';

const router = Router();

router.use(authenticate);
router.use(apiLimiter);


// ===== Workspace Routes =====

router.get('/', getUserWorkspacesController);

router.post(
  '/',
  validate(createSchema),
  createWorkspaceController,
);

router.get(
  '/:workspaceId',
  validate(workspaceParamsSchema),
  loadWorkspaceWithMembers,
  getWorkspaceController,
);

router.patch(
  '/:workspaceId',
  validate(updateWorkspaceSchema),
  loadWorkspace,
  requireWorkspaceRole('owner', 'admin'),
  updateWorkspaceController,
);

router.delete(
  '/:workspaceId',
  validate(workspaceParamsSchema),
  loadWorkspace,
  requireWorkspaceRole('owner'),
  deleteWorkspaceController,
);


// ===== Member Routes =====

router.post(
  '/:workspaceId/members/invite',
  validate(inviteMemberSchema),
  loadWorkspace,
  requireWorkspaceRole('owner', 'admin'),
  inviteMemberController,
);

router.patch(
  '/:workspaceId/members/:memberId/role',
  validate(updateMemberRoleSchema),
  loadWorkspace,
  requireWorkspaceRole('owner', 'admin'),
  updateMemberRoleController,
);

router.delete(
  '/:workspaceId/members/:memberId',
  validate(removeMemberSchema),
  loadWorkspace,
  removeMemberController,
);


export { router as workspaceRouter };