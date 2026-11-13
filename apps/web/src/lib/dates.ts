import type { Task } from '../api/types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's calendar date in the user's time zone, as YYYY-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${String(now.getFullYear())}-${month}-${day}`;
}

function parseIsoDate(value: string): Date {
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isOverdue(task: Pick<Task, 'dueDate' | 'status'>, now: Date = new Date()): boolean {
  return task.dueDate !== null && task.status !== 'done' && task.dueDate < todayIso(now);
}

export function formatDueDate(dueDate: string, now: Date = new Date()): string {
  const days = Math.round(
    (parseIsoDate(dueDate).getTime() - parseIsoDate(todayIso(now)).getTime()) / DAY_MS,
  );
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  const date = parseIsoDate(dueDate);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  });
}
