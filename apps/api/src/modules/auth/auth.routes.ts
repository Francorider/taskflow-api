import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import type { UserRow } from '../../db/schema.js';
import { errorResponseSchema } from '../../lib/schemas.js';
import {
  authResponseSchema,
  loginBodySchema,
  registerBodySchema,
  toUserDto,
  userSchema,
} from './auth.schemas.js';
import { AuthService } from './auth.service.js';

export const authRoutes: FastifyPluginCallbackZod = (app, _options, done) => {
  const service = new AuthService(app.db, app.config.BCRYPT_ROUNDS);
  const rateLimit = { max: app.config.AUTH_RATE_LIMIT_MAX, timeWindow: '1 minute' };
  const issue = (user: UserRow) => ({
    token: app.jwt.sign({ sub: user.id, email: user.email }),
    user: toUserDto(user),
  });

  app.post(
    '/register',
    {
      config: { rateLimit },
      schema: {
        tags: ['auth'],
        summary: 'Create an account and receive a token',
        body: registerBodySchema,
        response: { 201: authResponseSchema, 400: errorResponseSchema, 409: errorResponseSchema },
      },
    },
    async (request, reply) => {
      const user = await service.register(request.body);
      return reply.code(201).send(issue(user));
    },
  );

  app.post(
    '/login',
    {
      config: { rateLimit },
      schema: {
        tags: ['auth'],
        summary: 'Exchange credentials for a token',
        body: loginBodySchema,
        response: { 200: authResponseSchema, 400: errorResponseSchema, 401: errorResponseSchema },
      },
    },
    async (request) => {
      const user = await service.verifyCredentials(request.body.email, request.body.password);
      return issue(user);
    },
  );

  app.get(
    '/me',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['auth'],
        summary: 'Current user',
        security: [{ bearerAuth: [] }],
        response: { 200: userSchema, 401: errorResponseSchema, 404: errorResponseSchema },
      },
    },
    async (request) => toUserDto(await service.getById(request.user.sub)),
  );

  done();
};
