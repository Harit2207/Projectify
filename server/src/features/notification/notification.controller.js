import asyncHandler from 'express-async-handler';
import * as notificationService from './notification.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

export const getNotificationsController = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotifications(req.user._id, {
    page: Number(req.query.page) || 1,
    limit: 20,
  });
  sendSuccess(res, result);
});

export const markAsReadController = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(
    req.user._id,
    req.params.notificationId,
  );
  sendSuccess(res, { notification });
});

export const markAllAsReadController = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id);
  sendSuccess(res, null, 'All notifications marked as read');
});