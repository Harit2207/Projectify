import { Project } from './projects.model.js';
import { Epic } from './epic.model.js';
import {
  NotFoundError,
  ForbiddenError,
} from '../../core/errors/errorTypes.js';
import { logger } from '../../core/logger/logger.js';

// Task model imported lazily inside functions that need it
// to avoid circular dependency (task imports project, project imports task)
async function getTaskModel() {
  const { Task } = await import('../tasks/tasks.model.js');
  return Task;
}

export async function getProjects(workspaceId) {
  return Project.find({ workspaceId })
    .populate('createdBy', 'name avatar')
    .sort({ createdAt: -1 });
}

export async function createProject(workspaceId, userId, data) {
  const project = await Project.create({
    ...data,
    workspaceId,
    createdBy: userId,
  });

  logger.info('Project created', { projectId: project._id, workspaceId });
  return project;
}

export async function getProject(projectId, workspaceId) {
  const project = await Project.findOne({ _id: projectId, workspaceId })
    .populate('createdBy', 'name avatar');

  if (!project) throw new NotFoundError('Project');
  return project;
}

export async function updateProject(projectId, workspaceId, data) {
  const project = await Project.findOne({ _id: projectId, workspaceId });
  if (!project) throw new NotFoundError('Project');

  Object.assign(project, data);
  await project.save();
  return project;
}

export async function deleteProject(projectId, workspaceId, userRole) {
  if (!['owner', 'admin'].includes(userRole)) {
    throw new ForbiddenError('Only admins can delete projects');
  }

  const project = await Project.findOne({ _id: projectId, workspaceId });
  if (!project) throw new NotFoundError('Project');

  const Task = await getTaskModel();

  await Epic.deleteMany({ projectId });
  await Task.deleteMany({ projectId });
  await project.deleteOne();

  logger.info('Project deleted', { projectId, workspaceId });
}

export async function getEpics(projectId, workspaceId) {
  const Task = await getTaskModel();

  const epics = await Epic.find({ projectId, workspaceId })
    .populate('createdBy', 'name avatar')
    .sort({ createdAt: -1 });

  if (!epics.length) return [];

  const epicIds = epics.map((e) => e._id);

  const taskStats = await Task.aggregate([
    { $match: { epicId: { $in: epicIds } } },
    {
      $group: {
        _id: '$epicId',
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] },
        },
      },
    },
  ]);

  const statsMap = Object.fromEntries(
    taskStats.map((s) => [s._id.toString(), s]),
  );

  return epics.map((epic) => {
    const stats = statsMap[epic._id.toString()] ?? { total: 0, completed: 0 };
    const progress = stats.total === 0
      ? 0
      : Math.round((stats.completed / stats.total) * 100);

    return { ...epic.toObject(), taskStats: stats, progress };
  });
}

export async function createEpic(projectId, workspaceId, userId, data) {
  const project = await Project.findOne({ _id: projectId, workspaceId });
  if (!project) throw new NotFoundError('Project');

  const epic = await Epic.create({
    ...data,
    projectId,
    workspaceId,
    createdBy: userId,
  });

  return epic;
}

export async function updateEpic(epicId, workspaceId, data) {
  const epic = await Epic.findOne({ _id: epicId, workspaceId });
  if (!epic) throw new NotFoundError('Epic');

  Object.assign(epic, data);
  await epic.save();
  return epic;
}

export async function deleteEpic(epicId, workspaceId) {
  const Task = await getTaskModel();

  const epic = await Epic.findOne({ _id: epicId, workspaceId });
  if (!epic) throw new NotFoundError('Epic');

  // Unlink tasks — do not delete them
  await Task.updateMany({ epicId }, { $unset: { epicId: 1 } });
  await epic.deleteOne();

  logger.info('Epic deleted', { epicId, workspaceId });
}