import {
  PRIORITY_LABELS,
  SORT_FIELDS,
  SORT_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type SortField,
  type TagCount,
  type TaskPriority,
  type TaskStatus,
} from '../api/types';
import type { Filters } from '../lib/filters';
import { ArrowUpDownIcon, SearchIcon } from './Icons';

interface FilterBarProps {
  filters: Filters;
  tags: TagCount[];
  onChange: (patch: Partial<Filters>) => void;
}

const STATUS_TABS: { value: TaskStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  ...TASK_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] })),
];

export function FilterBar({ filters, tags, onChange }: FilterBarProps) {
  return (
    <div className="filters">
      <div className="tabs" role="tablist" aria-label="Filter by status">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value || 'all'}
            type="button"
            role="tab"
            aria-selected={filters.status === tab.value}
            className="tabs__tab"
            onClick={() => {
              onChange({ status: tab.value });
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="filters__row">
        <label className="search">
          <SearchIcon />
          <input
            aria-label="Search tasks"
            className="search__input"
            type="search"
            placeholder="Search tasks"
            value={filters.search}
            onChange={(e) => {
              onChange({ search: e.target.value });
            }}
          />
        </label>

        <select
          className="input input--compact"
          aria-label="Filter by priority"
          value={filters.priority}
          onChange={(e) => {
            onChange({ priority: e.target.value as TaskPriority | '' });
          }}
        >
          <option value="">Any priority</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>

        <select
          className="input input--compact"
          aria-label="Filter by tag"
          value={filters.tag}
          onChange={(e) => {
            onChange({ tag: e.target.value });
          }}
        >
          <option value="">Any tag</option>
          {tags.map(({ tag, count }) => (
            <option key={tag} value={tag}>
              #{tag} ({count})
            </option>
          ))}
        </select>

        <div className="sort">
          <select
            className="input input--compact"
            aria-label="Sort by"
            value={filters.sort}
            onChange={(e) => {
              onChange({ sort: e.target.value as SortField });
            }}
          >
            {SORT_FIELDS.map((field) => (
              <option key={field} value={field}>
                Sort: {SORT_LABELS[field]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="icon-button icon-button--bordered"
            onClick={() => {
              onChange({ order: filters.order === 'asc' ? 'desc' : 'asc' });
            }}
            aria-label={
              filters.order === 'asc'
                ? 'Sort ascending (click for descending)'
                : 'Sort descending (click for ascending)'
            }
            title={filters.order === 'asc' ? 'Ascending' : 'Descending'}
          >
            <ArrowUpDownIcon order={filters.order} />
          </button>
        </div>
      </div>
    </div>
  );
}
