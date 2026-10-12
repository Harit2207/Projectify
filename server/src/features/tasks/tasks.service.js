import { Task, STATUSES } from './tasks.model.js';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '../../core/errors/errorTypes.js';
import { logger } from '../../core/logger/logger.js';
import {
  emitToProject,
  emitToWorkspace,
} from '../../shared/utils/socketEmitter.js';
import { notifyTaskAssigned } from '../notification/notification.service.js';



// Project model imported lazily to avoid circular dependency
async function getProjectModel() {
  const { Project } = await import('../projects/projects.model.js');
  return Project;
}

export async function getTasks(projectId, workspaceId, filters = {}) {
  const {
    status,
    priority,
    assignee,
    epicId,
    search,
    page = 1,
    limit = 50,
  } = filters;

  const query = { projectId, workspaceId };

  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (assignee) query.assignees = assignee;
  if (epicId) query.epicId = epicId;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const [tasks, total] = await Promise.all([
    Task.find(query)
      .populate('assignees', 'name avatar email')
      .populate('epicId', 'title color')
      .populate('createdBy', 'name avatar')
      .sort({ status: 1, position: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Task.countDocuments(query),
  ]);

  return { tasks, total, page, limit };
}

export async function getTasksGrouped(projectId, workspaceId, filters = {}) {
  const { tasks } = await getTasks(projectId, workspaceId, {
    ...filters,
    limit: 500,
  });

  const grouped = Object.fromEntries(STATUSES.map((s) => [s, []]));
  for (const task of tasks) {
    grouped[task.status].push(task);
  }

  return grouped;
}

export async function createTask(projectId, workspaceId, userId, data) {
  const Project = await getProjectModel();
  const project = await Project.findOne({ _id: projectId, workspaceId });
  if (!project) throw new NotFoundError('Project');

  const lastTask = await Task.findOne({
    projectId,
    status: data.status ?? 'todo',
  }).sort({ position: -1 });

  const position = lastTask ? lastTask.position + 1000 : 1000;

  const task = await Task.create({
    ...data,
    projectId,
    workspaceId,
    createdBy: userId,
    position,
  });

  await task.populate('assignees', 'name avatar email');
  await task.populate('epicId', 'title color');
  await task.populate('createdBy', 'name avatar');

  logger.info('Task created', { taskId: task._id, projectId });

  emitToProject(projectId.toString(), 'task:created', { task });

  if (data.assignees?.length) {
    for (const assigneeId of data.assignees) {
      notifyTaskAssigned({
        assigneeId,
        workspaceId,
        taskTitle: task.title,
        projectId: task.projectId,
        taskId: task._id,
        actorId: userId,
      }).catch((err) => {
        logger.error('Failed to send assignment notification on task creation', {
          error: err.message,
        });
      });
    }
  }

  return task;
}

export async function getTask(taskId, workspaceId) {
  const task = await Task.findOne({ _id: taskId, workspaceId })
    .populate('assignees', 'name avatar email')
    .populate('epicId', 'title color')
    .populate('createdBy', 'name avatar');

  if (!task) throw new NotFoundError('Task');
  return task;
}

export async function updateTask(taskId, workspaceId, data, actorId = null) {

  const task = await Task.findOne({ _id: taskId, workspaceId });
  if (!task) throw new NotFoundError('Task');
  const projectId = task.projectId.toString();

  // Detect newly added assignees before overwriting
  const previousAssignees = task.assignees.map((id) => id.toString());
  const newAssignees = (data.assignees ?? []).map((id) => id.toString());

  const addedAssignees = newAssignees.filter(
    (id) => !previousAssignees.includes(id),
  );


  Object.assign(task, data);
  await task.save();

  await task.populate('assignees', 'name avatar email');
  await task.populate('epicId', 'title color');


  for (const assigneeId of addedAssignees) {
    notifyTaskAssigned({
      assigneeId,
      workspaceId,
      taskTitle: task.title,
      projectId: task.projectId,
      taskId: task._id,
      actorId,
    }).catch((err) => {
      
      logger.error('Failed to send assignment notification', {
        error: err.message,
      });
    });
  }



  emitToProject(projectId, 'task:updated', { task });

  return task;
}

export async function deleteTask(taskId, workspaceId, userId, userRole) {
  const task = await Task.findOne({ _id: taskId, workspaceId });
  if (!task) throw new NotFoundError('Task');
  const projectId = task.projectId.toString();

  const isCreator = task.createdBy.toString() === userId.toString();
  const canDelete = isCreator || ['owner', 'admin'].includes(userRole);

  if (!canDelete) {
    throw new ForbiddenError('Only the task creator or admins can delete tasks');
  }

  await task.deleteOne();

  emitToProject(projectId, 'task:deleted', { taskId });
  logger.info('Task deleted', { taskId, workspaceId });
}

export async function reorderTasks(updates, projectId, workspaceId) {
  if (!updates?.length) throw new BadRequestError('No updates provided');

  const Project = await getProjectModel();
  const project = await Project.findOne({ _id: projectId, workspaceId });
  if (!project) throw new NotFoundError('Project');

  const bulkOps = updates.map(({ taskId, status, position }) => ({
    updateOne: {
      filter: { _id: taskId, projectId, workspaceId },
      update: { $set: { status, position } },
    },
  }));

  await Task.bulkWrite(bulkOps);

  emitToProject(projectId.toString(), 'task:reordered', { updates });

  logger.info('Tasks reordered', { projectId, updateCount: updates.length });
}

export async function searchTasks(workspaceId, query) {
  if (!query || query.length < 1) return [];

  return Task.find({
    workspaceId,
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
    ],
  })
    .select('title status priority projectId epicId')
    .populate('epicId', 'title color')
    .limit(20);
}

export async function paginatedSearch(workspaceId, query, page = 1, limit = 20) {
  if (!query || query.length < 1) {
    return { tasks: [], total: 0, page, limit };
  }

  const filter = {
    workspaceId,
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
    ],
  };

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .select('title status priority projectId epicId dueDate assignees')
      .populate('assignees', 'name avatar')
      .populate('epicId', 'title color')
      .populate('projectId', 'name emoji')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  return { tasks, total, page, limit };
}