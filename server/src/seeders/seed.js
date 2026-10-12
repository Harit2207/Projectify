
import dns from 'dns';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // ignore
}

import { User } from '../features/auth/auth.model.js';
import { Workspace } from '../features/workspace/workspace.model.js';
import { Project } from '../features/projects/projects.model.js';
import { Epic } from '../features/projects/epic.model.js';
import { Task } from '../features/tasks/tasks.model.js';
import { Notification } from '../features/notification/notification.model.js';

dotenv.config();

const SHOULD_CLEAR = process.argv.includes('--clear');

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomDateWithinDays(daysBack) {
  const now = Date.now();
  const past = now - daysBack * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

function futureDateWithinDays(daysForward) {
  const now = Date.now();
  return new Date(now + Math.random() * daysForward * 24 * 60 * 60 * 1000);
}

const STATUSES = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];
const PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent'];

const SEED_USERS = [
  {
    name: 'Demo User',
    email: 'demo@projectify.dev',
    password: 'Demo@1234',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
    isVerified: true,
  },
  {
    name: 'Priya Sharma',
    email: 'priya@projectify.dev',
    password: 'Demo@1234',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    isVerified: true,
  },
  {
    name: 'Daniel Cho',
    email: 'daniel@projectify.dev',
    password: 'Demo@1234',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel',
    isVerified: true,
  },
  {
    name: 'Amara Okafor',
    email: 'amara@projectify.dev',
    password: 'Demo@1234',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amara',
    isVerified: true,
  },
];

const TASK_TITLES = [
  'Set up CI pipeline for staging',
  'Fix login redirect bug on Safari',
  'Design new onboarding flow',
  'Write unit tests for auth service',
  'Migrate database to new schema',
  'Add dark mode support',
  'Optimize image loading on dashboard',
  'Implement rate limiting on public API',
  'Refactor task service for clarity',
  'Add Google OAuth login option',
  'Set up error tracking with Sentry',
  'Improve mobile responsiveness',
  'Add CSV export for reports',
  'Fix memory leak in socket listener',
  'Write API documentation',
  'Add keyboard shortcuts to board',
  'Set up automated backups',
  'Improve search relevance ranking',
  'Add bulk task assignment',
  'Fix timezone bug in due dates',
  'Create email notification templates',
  'Add workspace usage analytics',
  'Implement drag and drop reordering',
  'Add two-factor authentication',
  'Fix duplicate notification bug',
  'Optimize MongoDB indexes',
  'Add task comments feature',
  'Set up staging environment',
  'Improve loading skeleton states',
  'Add file attachment support',
  'Fix race condition in token refresh',
  'Add audit log for admin actions',
  'Improve color contrast for accessibility',
  'Add Slack integration',
  'Write integration tests for tasks API',
  'Fix broken pagination on search page',
  'Add user profile settings page',
  'Implement soft delete for projects',
  'Add webhook support',
  'Fix CORS issue on production',
];

const LABELS_POOL = [
  'frontend', 'backend', 'bug', 'urgent', 'design',
  'performance', 'security', 'documentation', 'tech-debt', 'feature',
];

const EPIC_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6',
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.');

  if (SHOULD_CLEAR) {
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Workspace.deleteMany({}),
      Project.deleteMany({}),
      Epic.deleteMany({}),
      Task.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('Cleared.');
  }

  // ── 1. Create users ────────────────────────────────────────────
  console.log('Creating users...');
  const createdUsers = [];

  for (const userData of SEED_USERS) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      createdUsers.push(existing);
      continue;
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const user = await User.create({
  name: userData.name,
  email: userData.email,
  password: userData.password,
  avatar: userData.avatar,
  isVerified: userData.isVerified,
});
    createdUsers.push(user);
  }

  const [demoUser, priya, daniel, amara] = createdUsers;
  console.log(`Created ${createdUsers.length} users.`);

  // ── 2. Create workspaces ──────────────────────────────────────
  console.log('Creating workspaces...');

  const engineeringWorkspace = await Workspace.create({
  name: 'Acme Engineering',
  slug: `acme-engineering-${Math.random().toString(36).slice(2, 6)}`,
  description: 'Core product engineering team workspace',
  createdBy: demoUser._id,
  members: [
    { userId: demoUser._id, role: 'owner', joinedAt: randomDateWithinDays(90) },
    { userId: priya._id, role: 'admin', joinedAt: randomDateWithinDays(80) },
    { userId: daniel._id, role: 'member', joinedAt: randomDateWithinDays(60) },
    { userId: amara._id, role: 'member', joinedAt: randomDateWithinDays(45) },
  ],
});

const marketingWorkspace = await Workspace.create({
  name: 'Acme Marketing',
  slug: `acme-marketing-${Math.random().toString(36).slice(2, 6)}`,
  description: 'Marketing campaigns and content workspace',
  createdBy: demoUser._id,
  members: [
    { userId: demoUser._id, role: 'owner', joinedAt: randomDateWithinDays(70) },
    { userId: amara._id, role: 'admin', joinedAt: randomDateWithinDays(65) },
  ],
});

  console.log('Created 2 workspaces.');

  // ── 3. Create projects ─────────────────────────────────────────
  console.log('Creating projects...');

  const projectsData = [
    {
      workspace: engineeringWorkspace,
      name: 'Mobile App Revamp',
      emoji: '📱',
      description: 'Complete redesign of the mobile application',
      status: 'active',
    },
    {
      workspace: engineeringWorkspace,
      name: 'API v2 Migration',
      emoji: '🔧',
      description: 'Migrating legacy endpoints to the new API architecture',
      status: 'active',
    },
    {
      workspace: marketingWorkspace,
      name: 'Q3 Product Launch',
      emoji: '🚀',
      description: 'Coordinated launch campaign for the new feature set',
      status: 'active',
    },
    {
      workspace: marketingWorkspace,
      name: 'Content Calendar',
      emoji: '📝',
      description: 'Blog posts, social media, and newsletter planning',
      status: 'active',
    },
  ];

  const createdProjects = [];
  for (const p of projectsData) {
    const project = await Project.create({
      workspaceId: p.workspace._id,
      name: p.name,
      emoji: p.emoji,
      description: p.description,
      status: p.status,
      createdBy: demoUser._id,
    });
    createdProjects.push({ ...project.toObject(), _workspace: p.workspace });
  }

  console.log(`Created ${createdProjects.length} projects.`);

  // ── 4. Create epics per project ────────────────────────────────
  console.log('Creating epics...');

  const epicTitles = [
    ['User Authentication Overhaul', 'Onboarding Flow Redesign'],
    ['Endpoint Versioning', 'Backward Compatibility Layer'],
    ['Launch Day Coordination', 'Press & Media Outreach'],
    ['Weekly Blog Series', 'Social Media Campaign'],
  ];

  const createdEpics = [];

  for (let i = 0; i < createdProjects.length; i++) {
    const project = createdProjects[i];
    const titles = epicTitles[i];

    for (const title of titles) {
      const epic = await Epic.create({
  projectId: project._id,
  workspaceId: project.workspaceId,
  createdBy: project.createdBy,
  title,
  description: `Epic covering work related to: ${title.toLowerCase()}`,
  color: pick(EPIC_COLORS),
  status: pick(['planned', 'in_progress', 'in_progress', 'completed']),
  startDate: randomDateWithinDays(60),
  endDate: futureDateWithinDays(45),
});
      createdEpics.push({ ...epic.toObject(), _project: project });
    }
  }

  console.log(`Created ${createdEpics.length} epics.`);

  // ── 5. Create tasks ─────────────────────────────────────────────
  console.log('Creating tasks...');

  let taskTitleIndex = 0;
  let totalTasksCreated = 0;

  for (const project of createdProjects) {
    const workspaceMembers = project._workspace.members.map((m) => m.userId);
    const projectEpics = createdEpics.filter(
      (e) => e._project._id.toString() === project._id.toString(),
    );

    const taskCount = 12 + Math.floor(Math.random() * 6);
    const positionTracker = Object.fromEntries(STATUSES.map((s) => [s, 1000]));

    for (let i = 0; i < taskCount; i++) {
      const status = pick(STATUSES);
      const priority = pick(PRIORITIES);
      const title = TASK_TITLES[taskTitleIndex % TASK_TITLES.length];
      taskTitleIndex++;

      const hasEpic = Math.random() > 0.3 && projectEpics.length > 0;
      const epic = hasEpic ? pick(projectEpics) : null;

      const hasAssignees = Math.random() > 0.2;
      const assignees = hasAssignees
        ? pickMany(workspaceMembers, 1 + Math.floor(Math.random() * 2))
        : [];

      const hasDueDate = Math.random() > 0.4;
      const dueDate = hasDueDate
        ? Math.random() > 0.3
          ? futureDateWithinDays(30)
          : randomDateWithinDays(15)
        : null;

      const hasLabels = Math.random() > 0.5;
      const labels = hasLabels ? pickMany(LABELS_POOL, 1 + Math.floor(Math.random() * 2)) : [];

      const position = positionTracker[status];
      positionTracker[status] += 1000;

      const isDone = status === 'done';
      const completedAt = isDone ? randomDateWithinDays(25) : null;

      await Task.create({
        projectId: project._id,
        workspaceId: project.workspaceId,
        epicId: epic ? epic._id : null,
        title,
        description: Math.random() > 0.5
          ? `Detailed description for: ${title}. This task involves coordinating with the team and tracking progress carefully.`
          : '',
        status,
        priority,
        position,
        assignees,
        labels,
        dueDate,
        completedAt,
        checklist: Math.random() > 0.7
          ? [
              { text: 'Review requirements', completed: true },
              { text: 'Implement solution', completed: isDone },
              { text: 'Write tests', completed: isDone && Math.random() > 0.3 },
            ]
          : [],
        createdBy: pick(workspaceMembers),
      });

      totalTasksCreated++;
    }
  }

  console.log(`Created ${totalTasksCreated} tasks.`);

  // ── 6. Create notifications for demo user ───────────────────────
  // NOTE: workspaceId is REQUIRED on this schema — every notification
  // must belong to a specific workspace. Each template below is tied
  // to engineeringWorkspace since that's where the demo user is owner.
  console.log('Creating notifications...');

  const notificationTemplates = [
    {
      type: 'task_assigned',
      title: 'New task assigned',
      message: 'Priya assigned you a task: "Fix login redirect bug on Safari"',
      actorId: priya._id,
    },
    {
      type: 'task_completed',
      title: 'Task completed',
      message: 'Daniel marked "Set up CI pipeline for staging" as done',
      actorId: daniel._id,
    },
    {
      type: 'member_joined',
      title: 'New team member',
      message: 'Amara Okafor joined Acme Engineering',
      actorId: amara._id,
    },
    {
      type: 'task_due_soon',
      title: 'Task due soon',
      message: '"Write API documentation" is due in 2 days',
      actorId: null,
    },
    {
      type: 'task_assigned',
      title: 'New task assigned',
      message: 'You were assigned to "Add dark mode support"',
      actorId: priya._id,
    },
  ];

  for (const template of notificationTemplates) {
  await Notification.create({
    userId: demoUser._id,
    workspaceId: engineeringWorkspace._id,
    type: template.type,
    title: template.title,
    message: template.message,
    read: Math.random() > 0.6,
    meta: {
      taskId: null,
      projectId: null,
      actorId: template.actorId,
    },
  });
}

  console.log(`Created ${notificationTemplates.length} notifications.`);

  // ── Summary ────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log('Seeding complete.');
  console.log('========================================');
  console.log(`Users:         ${createdUsers.length}`);
  console.log(`Workspaces:    2`);
  console.log(`Projects:      ${createdProjects.length}`);
  console.log(`Epics:         ${createdEpics.length}`);
  console.log(`Tasks:         ${totalTasksCreated}`);
  console.log(`Notifications: ${notificationTemplates.length}`);
  console.log('----------------------------------------');
  console.log('Demo login credentials:');
  console.log('  email:    demo@projectify.dev');
  console.log('  password: Demo@1234');
  console.log('========================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
