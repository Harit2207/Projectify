import { describe, it, expect } from 'vitest';
import request from 'supertest';
import './helpers/setup.js';
import { app } from '../app.js';
import { createUserAndLogin, authedRequest } from './helpers/auth.js';
import { Task } from '../features/tasks/tasks.model.js';
import { Project } from '../features/projects/projects.model.js';
import { Workspace } from '../features/workspace/workspace.model.js';
import { User } from '../features/auth/auth.model.js';


// Helper: add second user to workspace with given role
async function addMemberToWorkspace(workspaceId, userId, role) {
  await Workspace.findByIdAndUpdate(workspaceId, {
    $push: { members: { userId, role } },
  });
}

// Helper: create a project in workspace
async function createProject(workspaceId, createdBy) {
  return Project.create({
    workspaceId,
    name: 'Test Project',
    emoji: '📋',
    status: 'active',
    createdBy,
  });
}

// Helper: create a task in project
async function createTask(projectId, workspaceId, createdBy) {
  return Task.create({
    title: 'Test Task',
    status: 'todo',
    priority: 'none',
    position: 1000,
    projectId,
    workspaceId,
    createdBy,
  });
}

describe('RBAC — Role-Based Access Control', () => {

  // ── MEMBER CANNOT DELETE WORKSPACE ──────────────────────────────

  it('member cannot delete a workspace — 403', async () => {
    // Owner creates workspace
    const owner = await createUserAndLogin({ email: 'owner@test.com', role: 'owner' });

    // Create second user as member
    const memberUser = await User.create({
      name: 'Member',
      email: 'member@test.com',
      password: 'Test@1234',
      isVerified: true,
    });
    // Login as member
    const memberLogin = await request(app)
      .post('/api/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'member@test.com', password: 'Test@1234' });
    const memberCookie = memberLogin.headers['set-cookie'];

    const res = await request(app)
      .delete(`/api/workspaces/${owner.workspaceId}`)
      .set('Cookie', memberCookie)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe('FORBIDDEN');
  });

  // ── VIEWER / MEMBER CANNOT DELETE TASK ──────────────────────────

  it('member (non-creator) cannot delete a task created by owner — 403', async () => {
    const owner = await createUserAndLogin({ email: 'owner2@test.com', role: 'owner' });

    // Create project + task as owner
    const project = await createProject(owner.workspaceId, owner.userId);
    const task = await createTask(project._id, owner.workspaceId, owner.userId);

    // Add member
   
    const memberUser = await User.create({ name: 'Member2', email: 'member2@test.com', password: 'Test@1234', isVerified: true });
    await addMemberToWorkspace(owner.workspaceId, memberUser._id, 'member');

    const memberLogin = await request(app)
      .post('/api/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'member2@test.com', password: 'Test@1234' });
    const memberCookie = memberLogin.headers['set-cookie'];

    const res = await request(app)
      .delete(`/api/workspaces/${owner.workspaceId}/tasks/${task._id}`)
      .set('Cookie', memberCookie)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(res.status).toBe(403);
  });

  // ── ADMIN CAN DELETE TASK ────────────────────────────────────────

  it('admin can delete a task created by someone else — 200', async () => {
    const owner = await createUserAndLogin({ email: 'owner3@test.com', role: 'owner' });
    const project = await createProject(owner.workspaceId, owner.userId);
    const task = await createTask(project._id, owner.workspaceId, owner.userId);

    // Add admin
    const adminUser = await User.create({ name: 'Admin', email: 'admin@test.com', password: 'Test@1234', isVerified: true });
    await addMemberToWorkspace(owner.workspaceId, adminUser._id, 'admin');

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'admin@test.com', password: 'Test@1234' });
    const adminCookie = adminLogin.headers['set-cookie'];

    const res = await request(app)
      .delete(`/api/workspaces/${owner.workspaceId}/tasks/${task._id}`)
      .set('Cookie', adminCookie)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Confirm it's actually gone from DB
    const deleted = await Task.findById(task._id);
    expect(deleted).toBeNull();
  });

  // ── TASK CREATOR CAN DELETE OWN TASK ────────────────────────────

  it('task creator (member) can delete their own task — 200', async () => {
    const owner = await createUserAndLogin({ email: 'owner4@test.com', role: 'owner' });
    const project = await createProject(owner.workspaceId, owner.userId);

    // Add member who creates their own task
    const creator = await User.create({ name: 'Creator', email: 'creator@test.com', password: 'Test@1234', isVerified: true });
    await addMemberToWorkspace(owner.workspaceId, creator._id, 'member');

    const task = await createTask(project._id, owner.workspaceId, creator._id);

    const creatorLogin = await request(app)
      .post('/api/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'creator@test.com', password: 'Test@1234' });
    const creatorCookie = creatorLogin.headers['set-cookie'];

    const res = await request(app)
      .delete(`/api/workspaces/${owner.workspaceId}/tasks/${task._id}`)
      .set('Cookie', creatorCookie)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(res.status).toBe(200);
  });

  // ── ADMIN CANNOT CHANGE OWNER ROLE ──────────────────────────────

  it('admin cannot change the owner\'s role — 400 or 403', async () => {
    const owner = await createUserAndLogin({ email: 'owner5@test.com', role: 'owner' });

   
    const adminUser = await User.create({ name: 'Admin2', email: 'admin2@test.com', password: 'Test@1234', isVerified: true });
    await addMemberToWorkspace(owner.workspaceId, adminUser._id, 'admin');

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'admin2@test.com', password: 'Test@1234' });
    const adminCookie = adminLogin.headers['set-cookie'];

    const res = await request(app)
      .patch(`/api/workspaces/${owner.workspaceId}/members/${owner.userId}/role`)
      .set('Cookie', adminCookie)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ role: 'member' });

    expect([400, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  // ── INVITE MEMBER ────────────────────────────────────────────────

  it('owner can invite a user by email', async () => {
    const owner = await createUserAndLogin({ email: 'owner6@test.com', role: 'owner' });

    // Create target user
    
    await User.create({ name: 'Invitee', email: 'invitee@test.com', password: 'Test@1234', isVerified: true });

    const res = await request(app)
      .post(`/api/workspaces/${owner.workspaceId}/members/invite`)
      .set('Cookie', owner.cookie)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'invitee@test.com', role: 'member' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('cannot invite same user twice — 409', async () => {
    const owner = await createUserAndLogin({ email: 'owner7@test.com', role: 'owner' });
  
    const dup = await User.create({ name: 'Dup', email: 'dup2@test.com', password: 'Test@1234', isVerified: true });
    await addMemberToWorkspace(owner.workspaceId, dup._id, 'member');

    const res = await request(app)
      .post(`/api/workspaces/${owner.workspaceId}/members/invite`)
      .set('Cookie', owner.cookie)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'dup2@test.com', role: 'member' });

    expect(res.status).toBe(409);
  });
});