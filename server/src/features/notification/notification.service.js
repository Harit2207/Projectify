import { sendTaskAssignmentEmail } from '../../core/services/email.service.js';
import { User } from '../auth/auth.model.js';
import { Notification } from './notification.model.js';
import { emitToUser } from '../../shared/utils/socketEmitter.js';
import { logger } from '../../core/logger/logger.js';


export async function createNotification({
  userId,
  workspaceId,
  type,
  title,
  message,
  meta = {},
}) {
  const notification = await Notification.create({
    userId,
    workspaceId,
    type,
    title,
    message,
    meta,
  });

  emitToUser(userId.toString(), 'notification:new', { notification });

  return notification;
}

export async function getNotifications(userId, { page = 1, limit = 20 } = {}) {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('meta.actorId', 'name avatar'),
    Notification.countDocuments({ userId, read: false }),
  ]);

  return { notifications, unreadCount };
}


export async function markAsRead(userId, notificationId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true },
  );
  return notification;
}

export async function markAllAsRead(userId) {
  await Notification.updateMany({ userId, read: false }, { read: true });
}

export async function notifyTaskAssigned({
  assigneeId,
  workspaceId,
  taskTitle,
  projectId,
  taskId,
  actorId,
}) {
  // Fire background task assignment email
  User.findById(assigneeId).select('name email').then((assignee) => {
    if (assignee && assignee.email) {
      sendTaskAssignmentEmail({
        to: assignee.email,
        userName: assignee.name,
        taskTitle,
      });
    }
  }).catch((err) => {
    logger.error('Failed to lookup assignee for email notification', { error: err.message });
  });

  return createNotification({
    userId: assigneeId,
    workspaceId,
    type: 'task_assigned',
    title: 'Task assigned to you',
    message: `You were assigned to "${taskTitle}"`,
    meta: { taskId, projectId, actorId },
  });
}

export async function notifyMemberJoined({
  workspaceId,
  workspaceName,
  newMemberId,
  actorId,
  memberIds,
}) {
  // Notify all existing members except the one who was just added
  const recipients = memberIds.filter(
    (id) => id.toString() !== newMemberId.toString(),
  );

  await Promise.all(
    recipients.map((userId) =>
      createNotification({
        userId,
        workspaceId,
        type: 'member_joined',
        title: 'New member joined',
        message: `A new member joined ${workspaceName}`,
        meta: { actorId },
      }),
    ),
  );
}