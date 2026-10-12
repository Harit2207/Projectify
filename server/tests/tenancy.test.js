import { describe, it, expect } from 'vitest';
import request from 'supertest';
import './helpers/setup.js';
import { app } from '../src/app.js';
import { createUserAndLogin } from './helpers/auth.js';
import { Project } from '../src/features/projects/projects.model.js';
import { Task } from '../src/features/tasks/tasks.model.js';

// Helper
async function createProject(workspaceId, createdBy) {
  return Project.create({
    workspaceId, name: 'Project', emoji: '📋', status: 'active', createdBy,
  });
}

async function createTask(projectId, workspaceId, createdBy) {
  return Task.create({
    title: 'Task', status: 'todo', priority: 'none',
    position: 1000, projectId, workspaceId, createdBy,
  });
}

describe('Multi-Tenancy — Cross-workspace isolation', () => {

  // ── USER FROM TENANT A CANNOT ACCESS TENANT B'S WORKSPACE ───────

  it('user from workspace A cannot GET workspace B — 403', async () => {
    const tenantA = await createUserAndLogin({ email: 'a@test.com' });
    const tenantB = await createUserAndLogin({ email: 'b@test.com' });

    // Tenant A user tries to access Tenant B's workspace
    const res = await request(app)
      .get(`/api/workspaces/${tenantB.workspaceId}`)
      .set('Cookie', tenantA.cookie)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // ── USER FROM TENANT A CANNOT GET TENANT B'S PROJECTS ───────────

  it('user from workspace A cannot list workspace B\'s projects — 403', async () => {
    const tenantA = await createUserAndLogin({ email: 'a2@test.com' });
    const tenantB = await createUserAndLogin({ email: 'b2@test.com' });

    const res = await request(app)
      .get(`/api/workspaces/${tenantB.workspaceId}/projects`)
      .set('Cookie', tenantA.cookie)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(res.status).toBe(403);
  });

  // ── USER FROM TENANT A CANNOT GET TENANT B'S TASK BY ID ─────────

  it('user from workspace A cannot access a task in workspace B by guessing ID — 403 or 404', async () => {
    const tenantA = await createUserAndLogin({ email: 'a3@test.com' });
    const tenantB = await createUserAndLogin({ email: 'b3@test.com' });

    // Create project + task in workspace B
    const project = await createProject(tenantB.workspaceId, tenantB.userId);
    const task = await createTask(project._id, tenantB.workspaceId, tenantB.userId);

    // Tenant A tries to access Tenant B's task
    // Even if they guess the task ID correctly, workspaceId filter blocks them
    const res = await request(app)
      .get(`/api/workspaces/${tenantB.workspaceId}/tasks/${task._id}`)
      .set('Cookie', tenantA.cookie)
      .set('X-Requested-With', 'XMLHttpRequest');

    // 403 from workspace membership check, OR 404 if workspaceId filter returns null
    expect([403, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  // ── IDOR — CANNOT UPDATE ANOTHER WORKSPACE'S TASK ───────────────

  it('IDOR: user cannot update a task in a workspace they do not belong to — 403', async () => {
    const tenantA = await createUserAndLogin({ email: 'a4@test.com' });
    const tenantB = await createUserAndLogin({ email: 'b4@test.com' });

    const project = await createProject(tenantB.workspaceId, tenantB.userId);
    const task = await createTask(project._id, tenantB.workspaceId, tenantB.userId);

    // Tenant A tries to update Tenant B's task using B's workspaceId in URL
    const res = await request(app)
      .patch(`/api/workspaces/${tenantB.workspaceId}/tasks/${task._id}`)
      .set('Cookie', tenantA.cookie)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ title: 'Hacked title' });

    expect(res.status).toBe(403);

    // Confirm task was NOT modified
    const unchanged = await Task.findById(task._id);
    expect(unchanged.title).toBe('Task');
  });

  // ── IDOR — CANNOT DELETE ANOTHER WORKSPACE'S TASK ───────────────

  it('IDOR: user cannot delete a task in a workspace they do not belong to — 403', async () => {
    const tenantA = await createUserAndLogin({ email: 'a5@test.com' });
    const tenantB = await createUserAndLogin({ email: 'b5@test.com' });

    const project = await createProject(tenantB.workspaceId, tenantB.userId);
    const task = await createTask(project._id, tenantB.workspaceId, tenantB.userId);

    const res = await request(app)
      .delete(`/api/workspaces/${tenantB.workspaceId}/tasks/${task._id}`)
      .set('Cookie', tenantA.cookie)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(res.status).toBe(403);

    // Task still exists
    const stillExists = await Task.findById(task._id);
    expect(stillExists).not.toBeNull();
  });

  // ── TASKS STAY IN CORRECT WORKSPACE ─────────────────────────────

  it('tasks created in workspace A do not appear in workspace B\'s task list', async () => {
    const tenantA = await createUserAndLogin({ email: 'a6@test.com' });
    const tenantB = await createUserAndLogin({ email: 'b6@test.com' });

    const projectA = await createProject(tenantA.workspaceId, tenantA.userId);
    await createTask(projectA._id, tenantA.workspaceId, tenantA.userId);
    await createTask(projectA._id, tenantA.workspaceId, tenantA.userId);

    const projectB = await createProject(tenantB.workspaceId, tenantB.userId);

    // Tenant B queries their own project's tasks
    const res = await request(app)
      .get(`/api/workspaces/${tenantB.workspaceId}/projects/${projectB._id}/tasks`)
      .set('Cookie', tenantB.cookie)
      .set('X-Requested-With', 'XMLHttpRequest');

    console.log('TASK LIST STATUS:', res.status);
    console.log('TASK LIST BODY:', res.body);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0); // Zero tasks from workspace A leak in
  });

  // ── VALID OBJECTID BUT WRONG WORKSPACE ───────────────────────────

  it('valid ObjectId from wrong workspace returns 403 or 404, not 200', async () => {
    const tenantA = await createUserAndLogin({ email: 'a7@test.com' });
    const tenantB = await createUserAndLogin({ email: 'b7@test.com' });

    const projectB = await createProject(tenantB.workspaceId, tenantB.userId);

    // Tenant A tries workspace B's project ID through workspace A's URL
    const res = await request(app)
      .get(`/api/workspaces/${tenantA.workspaceId}/projects/${projectB._id}`)
      .set('Cookie', tenantA.cookie)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect([403, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});