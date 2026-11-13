import { describe, expect, it } from 'vitest';
import {
  createTaskBodySchema,
  listTasksQuerySchema,
  updateTaskBodySchema,
} from '../../src/modules/tasks/tasks.schemas.js';

describe('createTaskBodySchema', () => {
  it('fills in defaults for optional fields', () => {
    expect(createTaskBodySchema.parse({ title: '  Ship it  ' })).toEqual({
      title: 'Ship it',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      tags: [],
    });
  });

  it('lowercases tags and rejects invalid characters', () => {
    expect(createTaskBodySchema.parse({ title: 't', tags: [' API '] }).tags).toEqual(['api']);
    expect(createTaskBodySchema.safeParse({ title: 't', tags: ['two words'] }).success).toBe(false);
  });

  it('rejects malformed due dates and blank titles', () => {
    expect(createTaskBodySchema.safeParse({ title: 't', dueDate: '2026-13-01' }).success).toBe(
      false,
    );
    expect(createTaskBodySchema.safeParse({ title: '   ' }).success).toBe(false);
  });

  it('caps the number of tags', () => {
    const tags = Array.from({ length: 11 }, (_, i) => `tag${String(i)}`);
    expect(createTaskBodySchema.safeParse({ title: 't', tags }).success).toBe(false);
  });
});

describe('updateTaskBodySchema', () => {
  it('accepts a partial update without injecting defaults', () => {
    expect(updateTaskBodySchema.parse({ status: 'done' })).toEqual({ status: 'done' });
  });

  it('allows clearing the due date', () => {
    expect(updateTaskBodySchema.parse({ dueDate: null })).toEqual({ dueDate: null });
  });

  it('rejects an empty patch', () => {
    expect(updateTaskBodySchema.safeParse({}).success).toBe(false);
  });
});

describe('listTasksQuerySchema', () => {
  it('coerces query-string numbers and applies defaults', () => {
    expect(listTasksQuerySchema.parse({ page: '2' })).toMatchObject({
      page: 2,
      pageSize: 20,
      sort: 'createdAt',
      order: 'desc',
    });
  });

  it('bounds page size and rejects unknown sort fields', () => {
    expect(listTasksQuerySchema.safeParse({ pageSize: '101' }).success).toBe(false);
    expect(listTasksQuerySchema.safeParse({ sort: 'password' }).success).toBe(false);
  });
});
