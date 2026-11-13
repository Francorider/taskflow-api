import { sql } from 'drizzle-orm';
import request from 'supertest';
import { buildApp, type App } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { createDb, type Database } from '../src/db/client.js';

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://taskflow:taskflow@localhost:5432/taskflow_test';

export interface TestContext {
  app: App;
  db: Database;
  close: () => Promise<void>;
}

export async function createTestContext(env: Record<string, string> = {}): Promise<TestContext> {
  const config = loadConfig({
    NODE_ENV: 'test',
    DATABASE_URL: TEST_DATABASE_URL,
    JWT_SECRET: 'integration-test-secret-at-least-32-chars',
    BCRYPT_ROUNDS: '4',
    AUTH_RATE_LIMIT_MAX: '1000',
    ...env,
  });
  const { db, pool } = createDb(config.DATABASE_URL);
  const app = await buildApp({ config, db });
  await app.ready();
  return {
    app,
    db,
    close: async () => {
      await app.close();
      await pool.end();
    },
  };
}

export async function resetDatabase(db: Database): Promise<void> {
  await db.execute(sql`truncate table tasks, users cascade`);
}

let userCounter = 0;

export async function registerUser(
  app: App,
  overrides: { email?: string; password?: string } = {},
) {
  userCounter += 1;
  const credentials = {
    email: overrides.email ?? `user${String(userCounter)}@example.com`,
    password: overrides.password ?? 'correct-horse-battery',
    name: `Test User ${String(userCounter)}`,
  };
  const res = await request(app.server).post('/api/auth/register').send(credentials).expect(201);
  const body = res.body as { token: string; user: { id: string; email: string } };
  return { ...body, credentials, auth: { Authorization: `Bearer ${body.token}` } };
}
