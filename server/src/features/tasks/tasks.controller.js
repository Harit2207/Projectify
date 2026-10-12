import asyncHandler from 'express-async-handler';
import * as taskService from './tasks.service.js';
import { sendSuccess, sendCreated, sendPagination } from '../../shared/utils/response.js';

export const getTasksController = asyncHandler(async (req, res) => {
  const result = await taskService.getTasks(
    req.params.projectId,
    req.workspace._id,
    req.query,
  );
  sendPagination(res, result.tasks, result);
});

export const getTasksGroupedController = asyncHandler(async (req, res) => {
  const grouped = await taskService.getTasksGrouped(
    req.params.projectId,
    req.workspace._id,
    req.query,
  );
  sendSuccess(res, { tasks: grouped });
});

export const createTaskController = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(
    req.params.projectId,
    req.workspace._id,
    req.user._id,
    req.body,
  );
  sendCreated(res, { task }, 'Task created');
});

export const getTaskController = asyncHandler(async (req, res) => {
  const task = await taskService.getTask(
    req.params.taskId,
    req.workspace._id,
  );
  sendSuccess(res, { task });
});

export const updateTaskController = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(
    req.params.taskId,
    req.workspace._id,
    req.body,
  );
  sendSuccess(res, { task }, 'Task updated');
});

export const deleteTaskController = asyncHandler(async (req, res) => {
  await taskService.deleteTask(
    req.params.taskId,
    req.workspace._id,
    req.user._id,
    req.workspaceRole,
  );
  sendSuccess(res, null, 'Task deleted');
});

export const reorderTasksController = asyncHandler(async (req, res) => {
  await taskService.reorderTasks(
    req.body.updates,
    req.body.projectId,
    req.workspace._id,
  );
  sendSuccess(res, null, 'Tasks reordered');
});

export const searchTasksController = asyncHandler(async (req, res) => {
  const tasks = await taskService.searchTasks(
    req.workspace._id,
    req.query.q,
  );
  sendSuccess(res, { tasks });
});

export const paginatedSearchController = asyncHandler(async (req, res) => {
  const { q, page, limit } = req.query;
  const result = await taskService.paginatedSearch(
    req.workspace._id,
    q,
    Number(page) || 1,
    Number(limit) || 20,
  );
  sendPagination(res, result.tasks, result);
});