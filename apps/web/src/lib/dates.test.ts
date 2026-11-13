import { describe, expect, it } from 'vitest';
import { formatDueDate, isOverdue, todayIso } from './dates';

const now = new Date(2026, 5, 15, 9, 30); // 15 June 2026, local time

describe('todayIso', () => {
  it('formats the local calendar date', () => {
    expect(todayIso(now)).toBe('2026-06-15');
  });
});

describe('isOverdue', () => {
  it('is true only for open tasks due before today', () => {
    expect(isOverdue({ dueDate: '2026-06-14', status: 'todo' }, now)).toBe(true);
    expect(isOverdue({ dueDate: '2026-06-15', status: 'todo' }, now)).toBe(false);
    expect(isOverdue({ dueDate: '2026-06-14', status: 'done' }, now)).toBe(false);
    expect(isOverdue({ dueDate: null, status: 'todo' }, now)).toBe(false);
  });
});

describe('formatDueDate', () => {
  it('uses relative words for nearby days', () => {
    expect(formatDueDate('2026-06-15', now)).toBe('Today');
    expect(formatDueDate('2026-06-16', now)).toBe('Tomorrow');
    expect(formatDueDate('2026-06-14', now)).toBe('Yesterday');
  });

  it('includes the year only when it differs from the current one', () => {
    expect(formatDueDate('2026-07-01', now)).not.toMatch(/2026/);
    expect(formatDueDate('2027-07-01', now)).toMatch(/2027/);
  });
});
