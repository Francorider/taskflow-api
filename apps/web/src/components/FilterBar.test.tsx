import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_FILTERS } from '../lib/filters';
import { FilterBar } from './FilterBar';

function setup(filters = DEFAULT_FILTERS) {
  const onChange = vi.fn();
  render(<FilterBar filters={filters} tags={[{ tag: 'bug', count: 3 }]} onChange={onChange} />);
  return { onChange, user: userEvent.setup() };
}

describe('FilterBar', () => {
  it('reports status, tag and sort changes as partial updates', async () => {
    const { onChange, user } = setup();

    await user.click(screen.getByRole('tab', { name: 'Done' }));
    await user.selectOptions(screen.getByLabelText('Filter by tag'), 'bug');
    await user.selectOptions(screen.getByLabelText('Sort by'), 'priority');

    expect(onChange.mock.calls).toEqual([
      [{ status: 'done' }],
      [{ tag: 'bug' }],
      [{ sort: 'priority' }],
    ]);
  });

  it('toggles the sort direction', async () => {
    const { onChange, user } = setup({ ...DEFAULT_FILTERS, order: 'desc' });
    await user.click(screen.getByRole('button', { name: /Sort descending/ }));
    expect(onChange).toHaveBeenCalledWith({ order: 'asc' });
  });

  it('marks the active status tab', () => {
    setup({ ...DEFAULT_FILTERS, status: 'in_progress' });
    expect(screen.getByRole('tab', { name: 'In progress' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});
