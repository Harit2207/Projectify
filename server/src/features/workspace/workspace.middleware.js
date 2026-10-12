import asyncHandler from 'express-async-handler';
import { Workspace } from './workspace.model.js';
import {
  NotFoundError,
  ForbiddenError,
} from '../../core/errors/errorTypes.js';


export const loadWorkspace = asyncHandler(async (req, res, next) => {
  const workspace = await Workspace.findById(req.params.workspaceId);

  if (!workspace) {
    throw new NotFoundError('Workspace');
  }

  if (!workspace.isMember(req.user._id)) {
    throw new ForbiddenError(
      'You are not a member of this workspace',
    );
  }

  req.workspace = workspace;
  req.workspaceRole = workspace.getMemberRole(req.user._id);

  next();
});

export const loadWorkspaceWithMembers = asyncHandler(async (req, res, next) => {
  const workspace = await Workspace.findById(req.params.workspaceId)
    .populate('members.userId', 'name email avatar');

  if (!workspace) {
    throw new NotFoundError('Workspace');
  }

  if (!workspace.isMember(req.user._id)) {
    throw new ForbiddenError(
      'You are not a member of this workspace',
    );
  }

  req.workspace = workspace;
  req.workspaceRole = workspace.getMemberRole(req.user._id);

  next();
});

export function requireWorkspaceRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.workspaceRole)) {
      throw new ForbiddenError(
        'You do not have permission to perform this action',
      );
    }

    next();
  };
}