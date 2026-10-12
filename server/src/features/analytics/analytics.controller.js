import asyncHandler from 'express-async-handler';
import * as analyticsService from './analytics.service.js';
import {sendSuccess} from '../../shared/utils/response.js';

export const getWorkspaceStatsController = asyncHandler(async(req, res) =>{
    const stats = await analyticsService.getWorkspaceStats(req.workspace._id);
    sendSuccess(res, {stats});
});

export const getProjectStatsController = asyncHandler(async (req, res) => {
  const stats = await analyticsService.getProjectStats(
    req.params.projectId,
    req.workspace._id,
  );
  sendSuccess(res, { stats });
});