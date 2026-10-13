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
  priority = 'medium',
}) {
  // Fire non-blocking background task assignment email with enriched metadata
  Promise.all([
    User.findById(assigneeId).select('name email'),
    User.findById(actorId).select('name'),
    (async () => {
      try {
        const { Project } = await import('../projects/projects.model.js');
        return await Project.findById(projectId).select('name');
      } catch {
        return null;
      }
    })(),
  ])
    .then(([assignee, actor, project]) => {
      if (assignee && assignee.email) {
        sendTaskAssignmentEmail({
          to: assignee.email,
          userName: assignee.name || 'Teammate',
          taskTitle,
          projectName: project ? project.name : 'Project',
          assignerName: actor ? actor.name : 'A team member',
          priority,
        });
      }
    })
    .catch((err) => {
      logger.error('Failed to lookup metadata for task assignment email', { error: err.message });
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