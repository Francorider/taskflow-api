import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestContext, registerUser, resetDatabase, type TestContext } from '../helpers.js';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  tags: string[];
  updatedAt: string;
}

let ctx: TestContext;
let auth: { Authorization: string };

const api = () => request(ctx.app.server);

async function createTask(body: Record<string, unknown>, headers = auth): Promise<Task> {
  const res = await api().post('/api/tasks').set(headers).send(body).expect(201);
  return res.body as Task;
}

async function listTasks(query: Record<string, string | number> = {}) {
  const res = await api().get('/api/tasks').query(query).set(auth).expect(200);
  return res.body as { data: Task[]; meta: { page: number; total: number; totalPages: number } };
}

const titles = (tasks: Task[]) => tasks.map((t) => t.title);

beforeAll(async () => {
  ctx = await createTestContext();
});
afterAll(async () => {
  await ctx.close();
});
beforeEach(async () => {
  await resetDatabase(ctx.db);
  ({ auth } = await registerUser(ctx.app));
});

describe('authentication', () => {
  it('requires a token on every task route', async () => {
    await api().get('/api/tasks').expect(401);
    await api().post('/api/tasks').send({ title: 'x' }).expect(401);
    await api().get('/api/tags').expect(401);
  });
});

describe('CRUD', () => {
  it('creates a task with defaults and normalised tags', async () => {
    const task = await createTask({ title: 'Write tests', tags: ['Testing', 'testing', 'api'] });
    expect(task).toMatchObject({
      title: 'Write tests',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      tags: ['testing', 'api'],
    });
  });

  it('reads, updates and deletes a task', async () => {
    const task = await createTask({ title: 'Original', dueDate: '2030-01-15' });

    await api().get(`/api/tasks/${task.id}`).set(auth).expect(200);

    const updated = await api()
      .patch(`/api/tasks/${task.id}`)
      .set(auth)
      .send({ status: 'done', dueDate: null })
      .expect(200);
    expect(updated.body).toMatchObject({ title: 'Original', status: 'done', dueDate: null });
    expect(Date.parse((updated.body as Task).updatedAt)).toBeGreaterThanOrEqual(
      Date.parse(task.updatedAt),
    );

    await api().delete(`/api/tasks/${task.id}`).set(auth).expect(204);
    await api().get(`/api/tasks/${task.id}`).set(auth).expect(404);
    await api().delete(`/api/tasks/${task.id}`).set(auth).expect(404);
  });

  it('rejects an empty patch and a malformed id', async () => {
    const task = await createTask({ title: 'Task' });
    const res = await api().patch(`/api/tasks/${task.id}`).set(auth).send({}).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    await api().get('/api/tasks/not-a-uuid').set(auth).expect(400);
  });
});

describe('ownership', () => {
  it("treats another user's task as not found", async () => {
    const task = await createTask({ title: 'Private' });
    const other = await registerUser(ctx.app);

    await api().get(`/api/tasks/${task.id}`).set(other.auth).expect(404);
    await api()
      .patch(`/api/tasks/${task.id}`)
      .set(other.auth)
      .send({ title: 'Hijacked' })
      .expect(404);
    await api().delete(`/api/tasks/${task.id}`).set(other.auth).expect(404);

    const otherList = await api().get('/api/tasks').set(other.auth).expect(200);
    expect(otherList.body.data).toEqual([]);
    const mine = await listTasks();
    expect(titles(mine.data)).toEqual(['Private']);
  });
});

describe('filtering', () => {
  beforeEach(async () => {
    await createTask({
      title: 'Fix login bug',
      priority: 'urgent',
      status: 'in_progress',
      tags: ['bug', 'auth'],
      dueDate: '2030-01-10',
    });
    await createTask({
      title: 'Write docs',
      description: 'Explain 100% of the API',
      priority: 'low',
      tags: ['docs'],
      dueDate: '2030-02-01',
    });
    await createTask({
      title: 'Refactor auth module',
      priority: 'high',
      status: 'done',
      tags: ['auth'],
    });
  });

  it('filters by status and priority', async () => {
    expect(titles((await listTasks({ status: 'done' })).data)).toEqual(['Refactor auth module']);
    expect(titles((await listTasks({ priority: 'urgent' })).data)).toEqual(['Fix login bug']);
  });

  it('requires every requested tag to be present', async () => {
    expect(titles((await listTasks({ tags: 'auth', sort: 'title', order: 'asc' })).data)).toEqual([
      'Fix login bug',
      'Refactor auth module',
    ]);
    expect(titles((await listTasks({ tags: 'auth,BUG' })).data)).toEqual(['Fix login bug']);
  });

  it('searches title and description case-insensitively, treating wildcards literally', async () => {
    expect(titles((await listTasks({ search: 'DOCS' })).data)).toEqual(['Write docs']);
    expect(titles((await listTasks({ search: '100%' })).data)).toEqual(['Write docs']);
    expect((await listTasks({ search: '%' })).data).toHaveLength(1);
  });

  it('filters by due date range, inclusive', async () => {
    const res = await listTasks({ dueFrom: '2030-01-10', dueTo: '2030-01-31' });
    expect(titles(res.data)).toEqual(['Fix login bug']);
  });

  it('rejects invalid filter values', async () => {
    await api().get('/api/tasks').query({ status: 'archived' }).set(auth).expect(400);
    await api().get('/api/tasks').query({ dueFrom: 'tomorrow' }).set(auth).expect(400);
  });
});

describe('sorting', () => {
  beforeEach(async () => {
    await createTask({ title: 'banana', priority: 'low', dueDate: '2030-03-01' });
    await createTask({ title: 'Apple', priority: 'urgent' });
    await createTask({ title: 'cherry', priority: 'medium', dueDate: '2030-01-01' });
  });

  it('sorts priority by severity, not alphabetically', async () => {
    const res = await listTasks({ sort: 'priority', order: 'desc' });
    expect(res.data.map((t) => t.priority)).toEqual(['urgent', 'medium', 'low']);
  });

  it('puts tasks without a due date last in both directions', async () => {
    expect(titles((await listTasks({ sort: 'dueDate', order: 'asc' })).data)).toEqual([
      'cherry',
      'banana',
      'Apple',
    ]);
    expect(titles((await listTasks({ sort: 'dueDate', order: 'desc' })).data)).toEqual([
      'banana',
      'cherry',
      'Apple',
    ]);
  });

  it('sorts titles case-insensitively', async () => {
    expect(titles((await listTasks({ sort: 'title', order: 'asc' })).data)).toEqual([
      'Apple',
      'banana',
      'cherry',
    ]);
  });
});

describe('pagination', () => {
  it('returns non-overlapping pages and accurate metadata', async () => {
    for (let i = 1; i <= 5; i += 1) await createTask({ title: `Task ${String(i)}` });

    const first = await listTasks({ pageSize: 2, page: 1, sort: 'title', order: 'asc' });
    const third = await listTasks({ pageSize: 2, page: 3, sort: 'title', order: 'asc' });

    expect(first.meta).toEqual({ page: 1, pageSize: 2, total: 5, totalPages: 3 });
    expect(titles(first.data)).toEqual(['Task 1', 'Task 2']);
    expect(titles(third.data)).toEqual(['Task 5']);
  });

  it('returns an empty page past the end', async () => {
    await createTask({ title: 'Only one' });
    const res = await listTasks({ page: 5 });
    expect(res.data).toEqual([]);
    expect(res.meta.total).toBe(1);
  });
});

describe('GET /api/tags', () => {
  it("counts tags across the user's own tasks only", async () => {
    await createTask({ title: 'a', tags: ['bug', 'api'] });
    await createTask({ title: 'b', tags: ['bug'] });
    const other = await registerUser(ctx.app);
    await createTask({ title: 'c', tags: ['secret'] }, other.auth);

    const res = await api().get('/api/tags').set(auth).expect(200);
    expect(res.body.data).toEqual([
      { tag: 'api', count: 1 },
      { tag: 'bug', count: 2 },
    ]);
  });
});
