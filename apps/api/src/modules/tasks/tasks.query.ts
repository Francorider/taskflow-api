import { and, arrayContains, asc, desc, eq, gte, ilike, lte, or, sql, type SQL } from 'drizzle-orm';
import { tasks } from '../../db/schema.js';
import type { ListTasksQuery } from './tasks.schemas.js';

/** Parses the `tags` query parameter ("a, B,a") into a clean, de-duplicated list. */
export function parseTagFilter(raw: string | undefined): string[] {
  if (!raw) return [];
  return normalizeTags(raw.split(','));
}

/** Trims, lowercases and de-duplicates tags while keeping their first-seen order. */
export function normalizeTags(tags: readonly string[]): string[] {
  const cleaned = tags.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0);
  return [...new Set(cleaned)];
}

/** Escapes LIKE wildcards so user input is matched literally. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export function buildTaskFilter(userId: string, query: ListTasksQuery): SQL | undefined {
  const conditions: (SQL | undefined)[] = [eq(tasks.userId, userId)];

  if (query.status) conditions.push(eq(tasks.status, query.status));
  if (query.priority) conditions.push(eq(tasks.priority, query.priority));

  const tags = parseTagFilter(query.tags);
  if (tags.length > 0) conditions.push(arrayContains(tasks.tags, tags));

  if (query.search) {
    const pattern = `%${escapeLike(query.search)}%`;
    conditions.push(or(ilike(tasks.title, pattern), ilike(tasks.description, pattern)));
  }

  if (query.dueFrom) conditions.push(gte(tasks.dueDate, query.dueFrom));
  if (query.dueTo) conditions.push(lte(tasks.dueDate, query.dueTo));

  return and(...conditions);
}

export function buildTaskOrder(
  sort: ListTasksQuery['sort'],
  order: ListTasksQuery['order'],
): SQL[] {
  const direction = order === 'asc' ? asc : desc;
  let primary: SQL;
  switch (sort) {
    case 'dueDate':
      // Tasks without a due date always go last, whichever direction is requested.
      primary =
        order === 'asc'
          ? sql`${tasks.dueDate} asc nulls last`
          : sql`${tasks.dueDate} desc nulls last`;
      break;
    case 'title':
      primary = direction(sql`lower(${tasks.title})`);
      break;
    case 'priority':
      primary = direction(tasks.priority);
      break;
    case 'updatedAt':
      primary = direction(tasks.updatedAt);
      break;
    case 'createdAt':
      primary = direction(tasks.createdAt);
      break;
  }
  // Tie-breakers keep pagination stable when the primary key has duplicates.
  return [primary, desc(tasks.createdAt), asc(tasks.id)];
}
