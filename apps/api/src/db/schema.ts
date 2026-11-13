import { sql } from 'drizzle-orm';
import { date, index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
// Declaration order matters: Postgres sorts enum values by it, so ORDER BY priority is low -> urgent.
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export const taskStatus = pgEnum('task_status', TASK_STATUSES);
export const taskPriority = pgEnum('task_priority', TASK_PRIORITIES);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  ...timestamps,
});

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    status: taskStatus('status').notNull().default('todo'),
    priority: taskPriority('priority').notNull().default('medium'),
    dueDate: date('due_date', { mode: 'string' }),
    tags: text('tags')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    ...timestamps,
  },
  (t) => [
    index('tasks_user_created_idx').on(t.userId, t.createdAt),
    index('tasks_user_due_idx').on(t.userId, t.dueDate),
    index('tasks_tags_gin_idx').using('gin', t.tags),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;
export type NewTaskRow = typeof tasks.$inferInsert;
