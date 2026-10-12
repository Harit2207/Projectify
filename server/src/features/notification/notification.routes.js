import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { apiLimiter } from '../../core/middleware/rateLimiter.js';
import { validateObjectId } from '../../core/middleware/validateObjectId.js';
import {
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
} from './notification.controller.js';

const router = Router();

router.use(authenticate, apiLimiter);

router.get('/', getNotificationsController);
router.patch('/read-all', markAllAsReadController);
router.patch('/:notificationId/read', validateObjectId('notificationId'), markAsReadController);

export { router as notificationRouter };


