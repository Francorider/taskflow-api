import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tasksApi } from '../api/endpoints';
import type { Page, Task } from '../api/types';
import { makeTask, renderWithQueryClient } from '../test/utils';
import { TasksPage } from './TasksPage';

vi.mock('../api/endpoints', () => ({
  authApi: {},
  tasksApi: { list: vi.fn(), tags: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

const list = vi.mocked(tasksApi.list);
const tags = vi.mocked(tasksApi.tags);

function page(tasks: Task[]): Page<Task> {
  return { data: tasks, meta: { page: 1, pageSize: 10, total: tasks.length, totalPages: 1 } };
}

const loginTask = makeTask({
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Fix login bug',
  priority: 'urgent',
  tags: ['bug'],
});
const notesTask = makeTask({
  id: '22222222-2222-4222-8222-222222222222',
  title: 'Write release notes',
  status: 'done',
});

beforeEach(() => {
  list.mockReset().mockResolvedValue(page([loginTask, notesTask]));
  tags.mockReset().mockResolvedValue({ data: [{ tag: 'bug', count: 1 }] });
});

describe('TasksPage', () => {
  it('loads and shows the first page of tasks', async () => {
    renderWithQueryClient(<TasksPage />);

    expect(await screen.findByText('Fix login bug')).toBeInTheDocument();
    expect(screen.getByText('Write release notes')).toBeInTheDocument();
    expect(screen.getByText('2 tasks')).toBeInTheDocument();
    expect(list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      status: undefined,
      priority: undefined,
      tags: undefined,
      search: undefined,
      sort: 'createdAt',
      order: 'desc',
    });
  });

  it('refetches with the new filter when a filter changes', async () => {
    renderWithQueryClient(<TasksPage />);
    await screen.findByText('Fix login bug');
    const user = userEvent.setup();

    list.mockResolvedValue(page([notesTask]));
    await user.click(screen.getByRole('tab', { name: 'Done' }));

    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'done', page: 1 }));
    expect(await screen.findByText('1 task match your filters')).toBeInTheDocument();
    expect(screen.queryByText('Fix login bug')).not.toBeInTheDocument();

    await user.selectOptions(await screen.findByLabelText('Filter by tag'), 'bug');
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'done', tags: 'bug' }));
  });

  it('opens an empty create dialog and closes it on cancel', async () => {
    renderWithQueryClient(<TasksPage />);
    await screen.findByText('Fix login bug');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'New task' }));

    const dialog = screen.getByRole('dialog', { name: 'New task' });
    expect(within(dialog).getByLabelText('Title')).toHaveValue('');
    expect(within(dialog).getByLabelText('Title')).toHaveFocus();
    expect(within(dialog).getByRole('button', { name: 'Create task' })).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
