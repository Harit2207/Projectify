import asyncHandler from 'express-async-handler';
import * as projectService from './projects.service.js';
import { sendSuccess, sendCreated } from '../../shared/utils/response.js';

export const getProjectsController = asyncHandler(async (req, res) => {
  const projects = await projectService.getProjects(req.workspace._id);
  sendSuccess(res, { projects });
});

export const createProjectController = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(
    req.workspace._id,
    req.user._id,
    req.body,
  );
  sendCreated(res, { project }, 'Project created');
});

export const getProjectController = asyncHandler(async (req, res) => {
  const project = await projectService.getProject(
    req.params.projectId,
    req.workspace._id,
  );
  sendSuccess(res, { project });
});

export const updateProjectController = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(
    req.params.projectId,
    req.workspace._id,
    req.body,
    req.workspaceRole,
  );
  sendSuccess(res, { project }, 'Project updated');
});

export const deleteProjectController = asyncHandler(async (req, res) => {
  await projectService.deleteProject(
    req.params.projectId,
    req.workspace._id,
    req.workspaceRole,
  );
  sendSuccess(res, null, 'Project deleted');
});

export const getEpicsController = asyncHandler(async (req, res) => {
  const epics = await projectService.getEpics(
    req.params.projectId,
    req.workspace._id,
  );
  sendSuccess(res, { epics });
});

export const createEpicController = asyncHandler(async (req, res) => {
  const epic = await projectService.createEpic(
    req.params.projectId,
    req.workspace._id,
    req.user._id,
    req.body,
  );
  sendCreated(res, { epic }, 'Epic created');
});

export const updateEpicController = asyncHandler(async (req, res) => {
  const epic = await projectService.updateEpic(
    req.params.epicId,
    req.workspace._id,
    req.body,
  );
  sendSuccess(res, { epic }, 'Epic updated');
});

export const deleteEpicController = asyncHandler(async (req, res) => {
  await projectService.deleteEpic(req.params.epicId, req.workspace._id);
  sendSuccess(res, null, 'Epic deleted');
});