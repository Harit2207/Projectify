import { beforeAll, afterAll, afterEach } from 'vitest';
import { startDb, stopDb, clearDb } from './db.js';

beforeAll(async () => {
  await startDb();
});

afterEach(async () => {
  await clearDb(); // wipe all collections between tests
});

afterAll(async () => {
  await stopDb();
});