import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { UnauthorizedError } from '../lib/errors.js';

export interface TokenPayload {
  sub: string;
  email: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: TokenPayload;
    user: TokenPayload;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  await app.register(fastifyJwt, {
    secret: app.config.JWT_SECRET,
    sign: { expiresIn: app.config.JWT_EXPIRES_IN },
  });

  app.decorate('authenticate', async (request: FastifyRequest) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new UnauthorizedError('Missing, invalid or expired token');
    }
  });
});
