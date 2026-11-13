import type { SortField, SortOrder, TaskPriority, TaskStatus } from '../api/types';

export interface Filters {
  status: TaskStatus | '';
  priority: TaskPriority | '';
  tag: string;
  search: string;
  sort: SortField;
  order: SortOrder;
}

export const DEFAULT_FILTERS: Filters = {
  status: '',
  priority: '',
  tag: '',
  search: '',
  sort: 'createdAt',
  order: 'desc',
};
