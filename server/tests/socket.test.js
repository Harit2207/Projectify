import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from 'vitest';
import { createServer } from 'http';
import { io as Client } from 'socket.io-client';
import { startDb, stopDb, clearDb } from './helpers/db.js';
import { app } from '../app.js';
import { initSocket } from '../config/socket.js'; // export your initSocket function
import { User } from '../features/auth/auth.model.js';
import { Workspace } from '../features/workspace/workspace.model.js';
import { signAccessToken } from '../shared/utils/jwt.js';
import bcrypt from 'bcrypt';

let httpServer;
let serverAddress;

// Helper: build a cookie string with a valid JWT
async function buildSocketCookie(userId) {
  const token = signAccessToken({ userId: userId.toString() });
  return `accessToken=${token}`;
}

// Helper: wait for an event with timeout
function waitForEvent(socket, event, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout: event '${event}' not received within ${timeoutMs}ms`));
    }, timeoutMs);

    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

// Helper: assert event is NOT received within timeout
function assertNoEvent(socket, event, timeoutMs = 800) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve('no-event'), timeoutMs);
    socket.once(event, (data) => {
      clearTimeout(timer);
      reject(new Error(`Unexpected event '${event}' was received: ${JSON.stringify(data)}`));
    });
  });
}

beforeAll(async () => {
  await startDb();

  httpServer = createServer(app);
  initSocket(httpServer);

  await new Promise(resolve => httpServer.listen(0, resolve));
  const port = httpServer.address().port;
  serverAddress = `http://localhost:${port}`;
});

afterAll(async () => {
  await new Promise(resolve => httpServer.close(resolve));
  await stopDb();
});

// Wipe between tests
afterEach(async () => {
  await clearDb();
});

describe('Socket.io — Real-time isolation', () => {

  // ── AUTHENTICATED USER CONNECTS ──────────────────────────────────

  it('authenticated user can connect and receives socket id', async () => {
    const hashed = await bcrypt.hash('Test@1234', 10);
    const user = await User.create({ name: 'Socket User', email: 'su@test.com', password: hashed, isVerified: true });
    const cookie = await buildSocketCookie(user._id);

    const socket = Client(serverAddress, {
      extraHeaders: { cookie },
      autoConnect: false,
    });

    await new Promise((resolve, reject) => {
      socket.on('connect', resolve);
      socket.on('connect_error', reject);
      socket.connect();
    });

    expect(socket.id).toBeTruthy();
    socket.disconnect();
  });

  // ── UNAUTHENTICATED USER CANNOT CONNECT ─────────────────────────

  it('unauthenticated socket connection is rejected', async () => {
    const socket = Client(serverAddress, {
      autoConnect: false,
    });

    await new Promise((resolve) => {
      socket.on('connect_error', (err) => {
        expect(err.message).toMatch(/authentication|token|unauthorized/i);
        resolve();
      });
      socket.connect();
    });

    expect(socket.connected).toBe(false);
    socket.disconnect();
  });

  // ── EVENT IN ONE PROJECT ROOM REACHES ROOM MEMBERS ──────────────

  it('task:updated event reaches both clients in the same project room', async () => {
    const hashed = await bcrypt.hash('Test@1234', 10);
    const userA = await User.create({ name: 'A', email: 'a@socket.com', password: hashed, isVerified: true });
    const userB = await User.create({ name: 'B', email: 'b@socket.com', password: hashed, isVerified: true });

    const cookieA = await buildSocketCookie(userA._id);
    const cookieB = await buildSocketCookie(userB._id);
    const projectId = 'project123';

    // Connect both
    const socketA = Client(serverAddress, { extraHeaders: { cookie: cookieA }, autoConnect: false });
    const socketB = Client(serverAddress, { extraHeaders: { cookie: cookieB }, autoConnect: false });

    await Promise.all([
      new Promise(r => { socketA.on('connect', r); socketA.connect(); }),
      new Promise(r => { socketB.on('connect', r); socketB.connect(); }),
    ]);

    // Both join the same project room
    socketA.emit('project:join', projectId);
    socketB.emit('project:join', projectId);
    await new Promise(r => setTimeout(r, 100)); // let joins register

    // B listens for the event
    const receivedByB = waitForEvent(socketB, 'task:updated');

    // A emits (simulating what the server would do after a task update)
    // In real tests, you'd call the HTTP endpoint which triggers the emit
    // For socket isolation testing we can test the room mechanism directly
    socketA.emit('test:broadcast', { room: `project:${projectId}`, event: 'task:updated', data: { task: { _id: 't1', title: 'Updated' } } });

    const data = await receivedByB;
    expect(data.task._id).toBe('t1');

    socketA.disconnect();
    socketB.disconnect();
  });

  // ── CORE TEST: EMIT IN ONE WORKSPACE ROOM, OTHER WORKSPACE GETS NOTHING ──

  it('task:updated in workspace A project room does NOT reach workspace B client', async () => {
    const hashed = await bcrypt.hash('Test@1234', 10);
    const userA = await User.create({ name: 'WA', email: 'wa@socket.com', password: hashed, isVerified: true });
    const userB = await User.create({ name: 'WB', email: 'wb@socket.com', password: hashed, isVerified: true });

    const wsA = await Workspace.create({
  name: 'WS A',
  slug: 'ws-a',
  createdBy: userA._id,
  members: [{ userId: userA._id, role: 'owner' }],
});

const wsB = await Workspace.create({
  name: 'WS B',
  slug: 'ws-b',
  createdBy: userB._id,
  members: [{ userId: userB._id, role: 'owner' }],
});

    const cookieA = await buildSocketCookie(userA._id);
    const cookieB = await buildSocketCookie(userB._id);

    const socketA = Client(serverAddress, { extraHeaders: { cookie: cookieA }, autoConnect: false });
    const socketB = Client(serverAddress, { extraHeaders: { cookie: cookieB }, autoConnect: false });

    await Promise.all([
      new Promise(r => { socketA.on('connect', r); socketA.connect(); }),
      new Promise(r => { socketB.on('connect', r); socketB.connect(); }),
    ]);

    // A joins their project room, B joins their DIFFERENT project room
    const projectAId = `project-of-ws-${wsA._id}`;
    const projectBId = `project-of-ws-${wsB._id}`;

    socketA.emit('project:join', projectAId);
    socketB.emit('project:join', projectBId);
    await new Promise(r => setTimeout(r, 100));

    // Assert B receives NOTHING when A's room gets an event
    const noEventForB = assertNoEvent(socketB, 'task:updated', 800);

    // Simulate event in A's room only
    socketA.emit('test:broadcast', {
      room: `project:${projectAId}`,
      event: 'task:updated',
      data: { task: { _id: 't-secret', title: 'WS A private task' } },
    });

    // This should resolve without error — B received nothing
    await expect(noEventForB).resolves.toBe('no-event');

    socketA.disconnect();
    socketB.disconnect();
  });

  // ── USER ROOM ISOLATION — NOTIFICATIONS ─────────────────────────

  it('notification:new for user A does NOT reach user B', async () => {
    const hashed = await bcrypt.hash('Test@1234', 10);
    const userA = await User.create({ name: 'NA', email: 'na@socket.com', password: hashed, isVerified: true });
    const userB = await User.create({ name: 'NB', email: 'nb@socket.com', password: hashed, isVerified: true });

    const cookieA = await buildSocketCookie(userA._id);
    const cookieB = await buildSocketCookie(userB._id);

    const socketA = Client(serverAddress, { extraHeaders: { cookie: cookieA }, autoConnect: false });
    const socketB = Client(serverAddress, { extraHeaders: { cookie: cookieB }, autoConnect: false });

    await Promise.all([
      new Promise(r => { socketA.on('connect', r); socketA.connect(); }),
      new Promise(r => { socketB.on('connect', r); socketB.connect(); }),
    ]);

    await new Promise(r => setTimeout(r, 100)); // let auto-join user rooms settle

    // B should not receive a notification meant for A
    const noEventForB = assertNoEvent(socketB, 'notification:new', 800);

    // Server emits to A's user room only
    socketA.emit('test:user-notify', {
      userId: userA._id.toString(),
      notification: { _id: 'n1', title: 'For A only' },
    });

    await expect(noEventForB).resolves.toBe('no-event');

    socketA.disconnect();
    socketB.disconnect();
  });

  // ── DISCONNECT LEAVES ROOM ───────────────────────────────────────

  it('client does not receive events after disconnecting', async () => {
    const hashed = await bcrypt.hash('Test@1234', 10);
    const user = await User.create({ name: 'Disc', email: 'disc@socket.com', password: hashed, isVerified: true });
    const cookie = await buildSocketCookie(user._id);

    const socket = Client(serverAddress, { extraHeaders: { cookie }, autoConnect: false });
    await new Promise(r => { socket.on('connect', r); socket.connect(); });

    socket.emit('project:join', 'proj-disc');
    await new Promise(r => setTimeout(r, 100));

    socket.disconnect();
    await new Promise(r => setTimeout(r, 100));

    const noEvent = assertNoEvent(socket, 'task:updated', 600);
    // Nothing should arrive on a disconnected socket
    await expect(noEvent).resolves.toBe('no-event');
  });
});