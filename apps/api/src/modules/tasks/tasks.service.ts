import { and, count, eq, sql } from 'drizzle-orm';
import type { Database } from '../../db/client.js';
import { tasks, type TaskRow } from '../../db/schema.js';
import { NotFoundError } from '../../lib/errors.js';
import { buildPageMeta, pageOffset, type PageMeta } from '../../lib/pagination.js';
import { buildTaskFilter, buildTaskOrder, normalizeTags } from './tasks.query.js';
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from './tasks.schemas.js';

export class TaskService {
  constructor(private readonly db: Database) {}

  async list(userId: string, query: ListTasksQuery): Promise<{ data: TaskRow[]; meta: PageMeta }> {
    const where = buildTaskFilter(userId, query);
    const [rows, totals] = await Promise.all([
      this.db
        .select()
        .from(tasks)
        .where(where)
        .orderBy(...buildTaskOrder(query.sort, query.order))
        .limit(query.pageSize)
        .offset(pageOffset(query.page, query.pageSize)),
      this.db.select({ total: count() }).from(tasks).where(where),
    ]);
    return { data: rows, meta: buildPageMeta(query.page, query.pageSize, totals[0]?.total ?? 0) };
  }

  async get(userId: string, id: string): Promise<TaskRow> {
    const task = await this.db.query.tasks.findFirst({ where: this.owned(userId, id) });
    if (!task) throw new NotFoundError('Task');
    return task;
  }

  async create(userId: string, input: CreateTaskInput): Promise<TaskRow> {
    const [task] = await this.db
      .insert(tasks)
      .values({ ...input, tags: normalizeTags(input.tags), userId })
      .returning();
    if (!task) throw new Error('Insert returned no row');
    return task;
  }

  async update(userId: string, id: string, patch: UpdateTaskInput): Promise<TaskRow> {
    const [task] = await this.db
      .update(tasks)
      .set({
        ...patch,
        tags: patch.tags && normalizeTags(patch.tags),
        // Use the database clock, the same source as the created_at default.
        updatedAt: sql`now()`,
      })
      .where(this.owned(userId, id))
      .returning();
    if (!task) throw new NotFoundError('Task');
    return task;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.db
      .delete(tasks)
      .where(this.owned(userId, id))
      .returning({ id: tasks.id });
    if (deleted.length === 0) throw new NotFoundError('Task');
  }

  async listTags(userId: string): Promise<{ tag: string; count: number }[]> {
    const tag = sql<string>`unnest(${tasks.tags})`.as('tag');
    return this.db
      .select({ tag, count: count() })
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .groupBy(sql`tag`)
      .orderBy(sql`tag`);
  }

  // Scoping every lookup by owner means another user's task id behaves exactly like a missing one.
  private owned(userId: string, id: string) {
    return and(eq(tasks.id, id), eq(tasks.userId, userId));
  }
}
