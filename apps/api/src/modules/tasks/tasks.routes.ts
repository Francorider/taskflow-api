import { z } from 'zod';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { errorResponseSchema } from '../../lib/schemas.js';
import {
  createTaskBodySchema,
  listTasksQuerySchema,
  tagListResponseSchema,
  taskListResponseSchema,
  taskParamsSchema,
  taskSchema,
  toTaskDto,
  updateTaskBodySchema,
} from './tasks.schemas.js';
import { TaskService } from './tasks.service.js';

export const taskRoutes: FastifyPluginCallbackZod = (app, _options, done) => {
  const service = new TaskService(app.db);
  const security = [{ bearerAuth: [] }];

  app.addHook('onRequest', app.authenticate);

  app.get(
    '/tasks',
    {
      schema: {
        tags: ['tasks'],
        summary: 'List tasks with filtering, sorting and pagination',
        security,
        querystring: listTasksQuerySchema,
        response: {
          200: taskListResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request) => {
      const { data, meta } = await service.list(request.user.sub, request.query);
      return { data: data.map(toTaskDto), meta };
    },
  );

  app.post(
    '/tasks',
    {
      schema: {
        tags: ['tasks'],
        summary: 'Create a task',
        security,
        body: createTaskBodySchema,
        response: { 201: taskSchema, 400: errorResponseSchema, 401: errorResponseSchema },
      },
    },
    async (request, reply) => {
      const task = await service.create(request.user.sub, request.body);
      return reply.code(201).send(toTaskDto(task));
    },
  );

  app.get(
    '/tasks/:id',
    {
      schema: {
        tags: ['tasks'],
        summary: 'Get a task',
        security,
        params: taskParamsSchema,
        response: { 200: taskSchema, 401: errorResponseSchema, 404: errorResponseSchema },
      },
    },
    async (request) => toTaskDto(await service.get(request.user.sub, request.params.id)),
  );

  app.patch(
    '/tasks/:id',
    {
      schema: {
        tags: ['tasks'],
        summary: 'Update some fields of a task',
        security,
        params: taskParamsSchema,
        body: updateTaskBodySchema,
        response: {
          200: taskSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request) =>
      toTaskDto(await service.update(request.user.sub, request.params.id, request.body)),
  );

  app.delete(
    '/tasks/:id',
    {
      schema: {
        tags: ['tasks'],
        summary: 'Delete a task',
        security,
        params: taskParamsSchema,
        response: {
          204: z.null().describe('Task deleted'),
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      await service.remove(request.user.sub, request.params.id);
      return reply.code(204).send(null);
    },
  );

  app.get(
    '/tags',
    {
      schema: {
        tags: ['tasks'],
        summary: 'Tags in use, with task counts',
        security,
        response: { 200: tagListResponseSchema, 401: errorResponseSchema },
      },
    },
    async (request) => ({ data: await service.listTags(request.user.sub) }),
  );

  done();
};
