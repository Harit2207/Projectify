import asyncHandler from 'express-async-handler';
import * as workspaceService from './workspace.service.js';
import { sendSuccess, sendCreated } from '../../shared/utils/response.js';

export const createWorkspaceController = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.createWorkspace(req.user._id, req.body);
  sendCreated(res, { workspace }, 'Workspace created');
});

export const getUserWorkspacesController = asyncHandler(async (req, res) => {
  const workspaces = await workspaceService.getUserWorkspaces(req.user._id);
  sendSuccess(res, { workspaces });
});

export const getWorkspaceController = asyncHandler(async (req, res) => {
  // req.workspace is attached by loadWorkspace middleware
  const workspace = workspaceService.getWorkspace(req.workspace);
  sendSuccess(res, { workspace });
});

export const updateWorkspaceController = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.updateWorkspace(req.workspace, req.body);
  sendSuccess(res, { workspace }, 'Workspace updated');
});

export const deleteWorkspaceController = asyncHandler(async (req, res) => {
  await workspaceService.deleteWorkspace(req.workspace, req.user._id);
  sendSuccess(res, null, 'Workspace deleted');
});

export const inviteMemberController = asyncHandler(async (req, res) => {
  const member = await workspaceService.inviteMember(req.workspace, req.body);
  sendCreated(res, { member }, 'Member invited successfully');
});

export const updateMemberRoleController = asyncHandler(async (req, res) => {
  const member = await workspaceService.updateMemberRole(
    req.workspace,
    req.params.memberId,
    req.body.role,
    req.user._id,
  );
  sendSuccess(res, { member }, 'Role updated');
});

export const removeMemberController = asyncHandler(async (req, res) => {
  await workspaceService.removeMember(
    req.workspace,
    req.params.memberId,
    req.user._id,
  );
  sendSuccess(res, null, 'Member removed');
});
