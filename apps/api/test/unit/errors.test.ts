import { describe, expect, it } from 'vitest';
import { isUniqueViolation, NotFoundError } from '../../src/lib/errors.js';

describe('isUniqueViolation', () => {
  it('finds the Postgres code on a wrapped cause', () => {
    const driverError = Object.assign(new Error('duplicate key'), { code: '23505' });
    expect(isUniqueViolation(new Error('query failed', { cause: driverError }))).toBe(true);
  });

  it('ignores other errors', () => {
    expect(isUniqueViolation(Object.assign(new Error('fk'), { code: '23503' }))).toBe(false);
    expect(isUniqueViolation('not an error')).toBe(false);
  });
});

describe('AppError subclasses', () => {
  it('carry status, code and message', () => {
    const error = new NotFoundError('Task');
    expect(error).toMatchObject({ statusCode: 404, code: 'NOT_FOUND', message: 'Task not found' });
    expect(error.name).toBe('NotFoundError');
  });
});
