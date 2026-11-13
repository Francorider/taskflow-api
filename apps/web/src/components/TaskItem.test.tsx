import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { makeTask } from '../test/utils';
import { TaskItem } from './TaskItem';

function setup(task = makeTask()) {
  const handlers = { onToggleDone: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
  render(
    <ul>
      <TaskItem task={task} {...handlers} />
    </ul>,
  );
  return { ...handlers, user: userEvent.setup() };
}

describe('TaskItem', () => {
  it('shows priority, tags and flags overdue tasks', () => {
    setup(makeTask({ priority: 'urgent', tags: ['bug'], dueDate: '2000-01-01' }));
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText('#bug')).toBeInTheDocument();
    expect(screen.getByText('(overdue)')).toBeInTheDocument();
  });

  it('does not flag a completed task as overdue', () => {
    setup(makeTask({ status: 'done', dueDate: '2000-01-01' }));
    expect(screen.queryByText('(overdue)')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('wires the checkbox and action buttons to the task', async () => {
    const task = makeTask({ title: 'Deploy' });
    const { onToggleDone, onEdit, onDelete, user } = setup(task);

    await user.click(screen.getByRole('checkbox', { name: 'Mark "Deploy" as done' }));
    await user.click(screen.getByRole('button', { name: 'Edit "Deploy"' }));
    await user.click(screen.getByRole('button', { name: 'Delete "Deploy"' }));

    expect(onToggleDone).toHaveBeenCalledWith(task);
    expect(onEdit).toHaveBeenCalledWith(task);
    expect(onDelete).toHaveBeenCalledWith(task);
  });
});
