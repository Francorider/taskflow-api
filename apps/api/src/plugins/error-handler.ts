import type { FastifyError, FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from 'fastify-type-provider-zod';
import { AppError } from '../lib/errors.js';

export interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}

function body(code: string, message: string, details?: unknown): ErrorBody {
  return { error: details === undefined ? { code, message } : { code, message, details } };
}

export const errorHandlerPlugin = fp((app: FastifyInstance) => {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      const details = error.validation.map((issue) => ({
        location: error.validationContext,
        path: issue.instancePath,
        message: issue.message,
      }));
      return reply.code(400).send(body('VALIDATION_ERROR', 'Request validation failed', details));
    }

    if (error instanceof AppError) {
      return reply.code(error.statusCode).send(body(error.code, error.message));
    }

    if (isResponseSerializationError(error)) {
      request.log.error({ err: error, issues: error.cause.issues }, 'response failed schema');
      return reply.code(500).send(body('INTERNAL_ERROR', 'Internal server error'));
    }

    // Framework errors with a client status (malformed JSON, rate limit, payload too large...).
    const status = error.statusCode ?? 500;
    if (status >= 400 && status < 500) {
      return reply.code(status).send(body(error.code, error.message));
    }

    request.log.error({ err: error }, 'unhandled error');
    return reply.code(500).send(body('INTERNAL_ERROR', 'Internal server error'));
  });

  app.setNotFoundHandler((request, reply) =>
    reply.code(404).send(body('NOT_FOUND', `Route ${request.method} ${request.url} not found`)),
  );
});
