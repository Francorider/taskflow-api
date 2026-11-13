import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestContext, registerUser, resetDatabase, type TestContext } from '../helpers.js';

let ctx: TestContext;

beforeAll(async () => {
  ctx = await createTestContext();
});
afterAll(async () => {
  await ctx.close();
});
beforeEach(async () => {
  await resetDatabase(ctx.db);
});

describe('POST /api/auth/register', () => {
  it('creates an account and returns a token without exposing the password hash', async () => {
    const res = await request(ctx.app.server)
      .post('/api/auth/register')
      .send({ email: 'Ada@Example.com', name: 'Ada', password: 'analytical-engine' })
      .expect(201);

    expect(res.body).toEqual({
      token: expect.any(String),
      user: {
        id: expect.any(String),
        email: 'ada@example.com',
        name: 'Ada',
        createdAt: expect.any(String),
      },
    });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it('rejects a duplicate email regardless of case', async () => {
    await registerUser(ctx.app, { email: 'grace@example.com' });
    const res = await request(ctx.app.server)
      .post('/api/auth/register')
      .send({ email: 'GRACE@example.com', name: 'Grace', password: 'another-password' })
      .expect(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('validates the payload', async () => {
    const res = await request(ctx.app.server)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', name: '', password: 'short' })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const paths = (res.body.error.details as { path: string }[]).map((d) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['/email', '/name', '/password']));
  });
});

describe('POST /api/auth/login', () => {
  it('returns a token for valid credentials', async () => {
    const { credentials } = await registerUser(ctx.app);
    const res = await request(ctx.app.server)
      .post('/api/auth/login')
      .send({ email: credentials.email.toUpperCase(), password: credentials.password })
      .expect(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('gives the same answer for a wrong password and an unknown email', async () => {
    const { credentials } = await registerUser(ctx.app);
    const wrongPassword = await request(ctx.app.server)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrong-password' })
      .expect(401);
    const unknownEmail = await request(ctx.app.server)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'wrong-password' })
      .expect(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user for a valid token', async () => {
    const { user, auth } = await registerUser(ctx.app);
    const res = await request(ctx.app.server).get('/api/auth/me').set(auth).expect(200);
    expect(res.body.id).toBe(user.id);
  });

  it('rejects missing and tampered tokens', async () => {
    const { token } = await registerUser(ctx.app);
    await request(ctx.app.server).get('/api/auth/me').expect(401);
    const tampered = `${token.slice(0, -2)}xx`;
    const res = await request(ctx.app.server)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tampered}`)
      .expect(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
