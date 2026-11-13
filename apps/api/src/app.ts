import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify, { type FastifyServerOptions } from 'fastify';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import type { Config } from './config.js';
import type { Database } from './db/client.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { taskRoutes } from './modules/tasks/tasks.routes.js';
import { authPlugin } from './plugins/auth.js';
import { errorHandlerPlugin } from './plugins/error-handler.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: Config;
    db: Database;
  }
}

export interface AppDependencies {
  config: Config;
  db: Database;
}

function loggerOptions(config: Config): FastifyServerOptions['logger'] {
  if (config.NODE_ENV === 'test') return false;
  if (config.NODE_ENV === 'development') {
    return { level: config.LOG_LEVEL, transport: { target: 'pino-pretty' } };
  }
  return { level: config.LOG_LEVEL };
}

export async function buildApp({ config, db }: AppDependencies) {
  const app = Fastify({
    logger: loggerOptions(config),
    // Trust only the nearest TRUST_PROXY hops; hop 0 is the proxy that connected to us.
    trustProxy: (_address: string, hop: number) => hop < config.TRUST_PROXY,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.decorate('config', config);
  app.decorate('db', db);

  await app.register(errorHandlerPlugin);
  await app.register(cors, { origin: config.CORS_ORIGIN.split(',').map((o) => o.trim()) });
  await app.register(rateLimit, { global: false });
  await app.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Taskflow API',
        version: '1.0.0',
        description: 'Task management REST API with JWT authentication.',
      },
      components: {
        securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });
  await app.register(authPlugin);

  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(taskRoutes, { prefix: '/api' });

  return app;
}

export type App = Awaited<ReturnType<typeof buildApp>>;
