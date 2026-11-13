import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { makeTask } from '../test/utils';
import { TaskForm } from './TaskForm';

function setup(task = undefined as ReturnType<typeof makeTask> | undefined) {
  const onSubmit = vi.fn();
  render(
    <TaskForm task={task} submitting={false} error={null} onSubmit={onSubmit} onCancel={vi.fn()} />,
  );
  return { onSubmit, user: userEvent.setup() };
}

describe('TaskForm', () => {
  it('requires a title before submitting', async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Create task' }));
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed values with parsed tags', async () => {
    const { onSubmit, user } = setup();
    await user.type(screen.getByLabelText('Title'), '  Ship v1  ');
    await user.selectOptions(screen.getByLabelText('Priority'), 'urgent');
    await user.type(screen.getByLabelText('Due date'), '2030-05-01');
    await user.type(screen.getByLabelText('Tags'), 'Release, backend, release');
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Ship v1',
      description: '',
      status: 'todo',
      priority: 'urgent',
      dueDate: '2030-05-01',
      tags: ['release', 'backend'],
    });
  });

  it('prefills fields when editing', () => {
    setup(makeTask({ title: 'Existing', priority: 'high', tags: ['a', 'b'] }));
    expect(screen.getByLabelText('Title')).toHaveValue('Existing');
    expect(screen.getByLabelText('Priority')).toHaveValue('high');
    expect(screen.getByLabelText('Tags')).toHaveValue('a, b');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });
});
