import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestContext, type TestContext } from '../helpers.js';

let ctx: TestContext;

beforeAll(async () => {
  ctx = await createTestContext();
});
afterAll(async () => {
  await ctx.close();
});

describe('application', () => {
  it('reports health including the database', async () => {
    const res = await request(ctx.app.server).get('/api/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', database: 'ok' });
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(ctx.app.server).get('/api/nope').expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns a 400 for malformed JSON', async () => {
    const res = await request(ctx.app.server)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":')
      .expect(400);
    expect(res.body.error.message).toEqual(expect.any(String));
  });

  it('serves the OpenAPI document', async () => {
    const res = await request(ctx.app.server).get('/docs/json').expect(200);
    expect(res.body.openapi).toBe('3.1.0');
    expect(Object.keys(res.body.paths as object)).toEqual(
      expect.arrayContaining(['/api/tasks', '/api/tasks/{id}', '/api/auth/login']),
    );
  });
});

describe('behind a reverse proxy', () => {
  it('rate-limits by the client address from the trusted hop, ignoring spoofed entries', async () => {
    const proxied = await createTestContext({ TRUST_PROXY: '1', AUTH_RATE_LIMIT_MAX: '2' });
    try {
      const login = (forwardedFor: string) =>
        request(proxied.app.server)
          .post('/api/auth/login')
          .set('X-Forwarded-For', forwardedFor)
          .send({ email: 'nobody@example.com', password: 'wrong' });

      // Same real client (last hop) with a different spoofed first entry each time.
      expect((await login('1.1.1.1, 203.0.113.7')).status).toBe(401);
      expect((await login('2.2.2.2, 203.0.113.7')).status).toBe(401);
      expect((await login('3.3.3.3, 203.0.113.7')).status).toBe(429);
      // A different real client has its own budget.
      expect((await login('1.1.1.1, 203.0.113.8')).status).toBe(401);
    } finally {
      await proxied.close();
    }
  });
});
