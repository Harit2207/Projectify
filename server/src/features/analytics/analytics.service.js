import { Task, STATUSES, PRIORITIES } from '../tasks/tasks.model.js';
import { Project } from '../projects/projects.model.js';

// ─────────────────────────────────────────────────────────────
// Workspace-level stats
// ─────────────────────────────────────────────────────────────
export async function getWorkspaceStats(workspaceId) {
  const [
    totalTasks,
    tasksByStatus,
    tasksByPriority,
    overdueCount,
    completedThisWeek,
    totalProjects,
    recentActivity,
  ] = await Promise.all([
    // Total tasks
    Task.countDocuments({ workspaceId }),

    // Tasks grouped by status
    Task.aggregate([
      { $match: { workspaceId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    // Tasks grouped by priority
    Task.aggregate([
      { $match: { workspaceId } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]),

    // Overdue tasks
    Task.countDocuments({
      workspaceId,
      dueDate: { $lt: new Date() },
      status: { $ne: 'done' },
    }),

    // Tasks completed in last 7 days
    Task.countDocuments({
      workspaceId,
      status: 'done',
      completedAt: {
        $exists: true,
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    }),

    // Total projects
    Project.countDocuments({ workspaceId }),

    // Completion trend (last 30 days)
    Task.aggregate([
      {
        $match: {
          workspaceId,
          status: 'done',
          completedAt: {
            $exists: true,
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$completedAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]),
  ]);

  // Normalize status map
  const statusMap = Object.fromEntries(
    STATUSES.map((status) => [status, 0]),
  );

  for (const item of tasksByStatus) {
    statusMap[item._id] = item.count;
  }

  // Normalize priority map
  const priorityMap = Object.fromEntries(
    PRIORITIES.map((priority) => [priority, 0]),
  );

  for (const item of tasksByPriority) {
    priorityMap[item._id] = item.count;
  }

  return {
    totals: {
      tasks: totalTasks,
      projects: totalProjects,
      overdue: overdueCount,
      completedThisWeek,
    },
    tasksByStatus: statusMap,
    tasksByPriority: priorityMap,
    completionTrend: recentActivity,
  };
}

// ─────────────────────────────────────────────────────────────
// Project-level stats
// ─────────────────────────────────────────────────────────────
export async function getProjectStats(projectId, workspaceId) {
  const [
    tasksByStatus,
    tasksByAssignee,
    tasksByPriority,
    overdueCount,
  ] = await Promise.all([
    // Tasks by status
    Task.aggregate([
      { $match: { projectId, workspaceId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),

    // Workload by assignee
    Task.aggregate([
      {
        $match: {
          projectId,
          workspaceId,
          status: { $ne: 'done' },
        },
      },
      {
        $unwind: '$assignees',
      },
      {
        $group: {
          _id: '$assignees',
          taskCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          taskCount: 1,
          name: '$user.name',
          avatar: '$user.avatar',
        },
      },
      {
        $sort: {
          taskCount: -1,
        },
      },
    ]),

    // Tasks by priority
    Task.aggregate([
      { $match: { projectId, workspaceId } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]),

    // Overdue tasks
    Task.countDocuments({
      projectId,
      workspaceId,
      dueDate: { $lt: new Date() },
      status: { $ne: 'done' },
    }),
  ]);

  // Normalize status map
  const statusMap = Object.fromEntries(
    STATUSES.map((status) => [status, 0]),
  );

  for (const item of tasksByStatus) {
    statusMap[item._id] = item.count;
  }

  const total = Object.values(statusMap).reduce(
    (sum, count) => sum + count,
    0,
  );

  const completed = statusMap.done ?? 0;

  const progress =
    total === 0
      ? 0
      : Math.round((completed / total) * 100);

  // Normalize priority map
  const priorityMap = Object.fromEntries(
    PRIORITIES.map((priority) => [priority, 0]),
  );

  for (const item of tasksByPriority) {
    priorityMap[item._id] = item.count;
  }

  return {
    progress,
    totals: {
      total,
      completed,
      overdue: overdueCount,
    },
    tasksByStatus: statusMap,
    tasksByPriority: priorityMap,
    tasksByAssignee,
  };
}