import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { tasksApi } from '../api/endpoints';
import type { Task, TaskInput, TaskQuery } from '../api/types';
import { FilterBar } from '../components/FilterBar';
import { PlusIcon } from '../components/Icons';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { TaskForm } from '../components/TaskForm';
import { TaskItem } from '../components/TaskItem';
import { describeError } from '../lib/errors';
import { DEFAULT_FILTERS, type Filters } from '../lib/filters';
import { useDebouncedValue } from '../lib/useDebouncedValue';

const PAGE_SIZE = 10;

type Editing = { mode: 'create' } | { mode: 'edit'; task: Task } | null;

export function TasksPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Editing>(null);
  const search = useDebouncedValue(filters.search.trim());

  const query: TaskQuery = {
    page,
    pageSize: PAGE_SIZE,
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    tags: filters.tag || undefined,
    search: search || undefined,
    sort: filters.sort,
    order: filters.order,
  };

  const tasksQuery = useQuery({
    queryKey: ['tasks', query],
    queryFn: () => tasksApi.list(query),
    placeholderData: keepPreviousData,
  });
  const tagsQuery = useQuery({ queryKey: ['tags'], queryFn: tasksApi.tags });

  const closeEditor = useCallback(() => {
    setEditing(null);
  }, []);

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['tags'] }),
    ]);

  const saveTask = useMutation({
    mutationFn: (input: TaskInput) =>
      editing?.mode === 'edit' ? tasksApi.update(editing.task.id, input) : tasksApi.create(input),
    onSuccess: async () => {
      closeEditor();
      await invalidate();
    },
  });

  const toggleDone = useMutation({
    mutationFn: (task: Task) =>
      tasksApi.update(task.id, { status: task.status === 'done' ? 'todo' : 'done' }),
    onSettled: invalidate,
  });

  const deleteTask = useMutation({
    mutationFn: (task: Task) => tasksApi.remove(task.id),
    onSuccess: () => {
      // Deleting the only task on a later page would otherwise leave an empty page.
      if (tasksQuery.data?.data.length === 1) setPage((current) => Math.max(1, current - 1));
    },
    onSettled: invalidate,
  });

  function updateFilters(patch: Partial<Filters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  }

  function openEditor(next: Editing) {
    saveTask.reset();
    setEditing(next);
  }

  const data = tasksQuery.data;
  const hasFilters =
    filters.status !== '' || filters.priority !== '' || filters.tag !== '' || search !== '';
  const mutationError = toggleDone.error ?? deleteTask.error;

  return (
    <section className="tasks">
      <div className="tasks__header">
        <div>
          <h1 className="tasks__title">My tasks</h1>
          {data && (
            <p className="tasks__count">
              {data.meta.total} {data.meta.total === 1 ? 'task' : 'tasks'}
              {hasFilters ? ' match your filters' : ''}
            </p>
          )}
        </div>
        <button
          type="button"
          className="button button--primary"
          onClick={() => {
            openEditor({ mode: 'create' });
          }}
        >
          <PlusIcon />
          New task
        </button>
      </div>

      <FilterBar filters={filters} tags={tagsQuery.data?.data ?? []} onChange={updateFilters} />

      {mutationError && (
        <p className="banner banner--error" role="alert">
          {describeError(mutationError)}
        </p>
      )}

      {tasksQuery.isPending ? (
        <div className="center-block" role="status">
          <span className="spinner" aria-hidden="true" />
          <span className="visually-hidden">Loading tasks</span>
        </div>
      ) : tasksQuery.isError ? (
        <div className="empty">
          <p className="empty__title">Could not load tasks</p>
          <p className="empty__text">{describeError(tasksQuery.error)}</p>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => void tasksQuery.refetch()}
          >
            Try again
          </button>
        </div>
      ) : data && data.data.length > 0 ? (
        <>
          <ul className={`task-list${tasksQuery.isFetching ? ' task-list--refreshing' : ''}`}>
            {data.data.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleDone={(t) => {
                  toggleDone.mutate(t);
                }}
                onEdit={(t) => {
                  openEditor({ mode: 'edit', task: t });
                }}
                onDelete={(t) => {
                  if (window.confirm(`Delete "${t.title}"? This cannot be undone.`))
                    deleteTask.mutate(t);
                }}
              />
            ))}
          </ul>
          <Pagination meta={data.meta} onPageChange={setPage} />
        </>
      ) : (
        <div className="empty">
          <p className="empty__title">{hasFilters ? 'No matching tasks' : 'No tasks yet'}</p>
          <p className="empty__text">
            {hasFilters
              ? 'Try a different search or clear the filters.'
              : 'Create your first task to get started.'}
          </p>
          {hasFilters && (
            <button
              type="button"
              className="button button--ghost"
              onClick={() => {
                updateFilters({ ...DEFAULT_FILTERS, sort: filters.sort, order: filters.order });
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {editing && (
        <Modal title={editing.mode === 'edit' ? 'Edit task' : 'New task'} onClose={closeEditor}>
          <TaskForm
            task={editing.mode === 'edit' ? editing.task : undefined}
            submitting={saveTask.isPending}
            error={saveTask.error ? describeError(saveTask.error) : null}
            onSubmit={(input) => {
              saveTask.mutate(input);
            }}
            onCancel={closeEditor}
          />
        </Modal>
      )}
    </section>
  );
}
