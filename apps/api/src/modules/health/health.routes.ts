import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';

const healthSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  database: z.enum(['ok', 'unreachable']),
});

export const healthRoutes: FastifyPluginCallbackZod = (app, _options, done) => {
  app.get(
    '/health',
    {
      // Polled by container health checks; keep it out of the request log.
      logLevel: 'warn',
      schema: {
        tags: ['health'],
        summary: 'Liveness and database connectivity',
        response: { 200: healthSchema, 503: healthSchema },
      },
    },
    async (request, reply) => {
      try {
        await app.db.execute(sql`select 1`);
        return { status: 'ok' as const, database: 'ok' as const };
      } catch (error) {
        request.log.error({ err: error }, 'health check: database unreachable');
        return reply.code(503).send({ status: 'degraded', database: 'unreachable' });
      }
    },
  );

  done();
};
