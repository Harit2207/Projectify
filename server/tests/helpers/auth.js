import request from 'supertest';
import { app } from '../../src/app.js';
import { User } from '../../src/features/auth/auth.model.js';
import { Workspace } from '../../src/features/workspace/workspace.model.js';

// Creates a user + workspace, logs in, returns { cookie, userId, workspaceId }
export async function createUserAndLogin(overrides = {}) {
  const email = overrides.email ?? `user_${Date.now()}@test.com`;
  const password = overrides.password ?? 'Test@1234';

  const user = await User.create({
    name: overrides.name ?? 'Test User',
    email,
    password, // Plain text: User model hashes it in pre('save')
    isVerified: true,
  });

  const workspace = await Workspace.create({
    name: overrides.workspaceName ?? 'Test Workspace',
    slug: `test-ws-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdBy: user._id,
    members: [{ userId: user._id, role: overrides.role ?? 'owner' }],
  });

  const res = await request(app)
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .set('X-Requested-With', 'XMLHttpRequest')
    .send({ email, password });

  const cookie = res.headers['set-cookie'];

  if (res.status !== 200 || !cookie) {
    throw new Error(
      `Test helper login failed (${res.status}): ${JSON.stringify(res.body)}`
    );
  }

  return {
    cookie,
    userId: user._id.toString(),
    workspaceId: workspace._id.toString(),
    workspace,
    user,
    email,
    password,
  };
}

export function authedRequest(method, url, cookie) {
  if (!cookie) {
    throw new Error('authedRequest received an undefined or empty cookie');
  }

  return request(app)
    [method](url)
    .set('Cookie', cookie)
    .set('X-Requested-With', 'XMLHttpRequest')
    .set('Content-Type', 'application/json');
}