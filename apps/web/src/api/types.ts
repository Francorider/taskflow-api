export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export const SORT_FIELDS = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type SortField = (typeof SORT_FIELDS)[number];
export type SortOrder = 'asc' | 'desc';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const SORT_LABELS: Record<SortField, string> = {
  createdAt: 'Created',
  updatedAt: 'Updated',
  dueDate: 'Due date',
  priority: 'Priority',
  title: 'Title',
};

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  tags: string[];
}

export interface TaskQuery {
  page: number;
  pageSize: number;
  status?: TaskStatus | undefined;
  priority?: TaskPriority | undefined;
  tags?: string | undefined;
  search?: string | undefined;
  sort: SortField;
  order: SortOrder;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Page<T> {
  data: T[];
  meta: PageMeta;
}

export interface TagCount {
  tag: string;
  count: number;
}
