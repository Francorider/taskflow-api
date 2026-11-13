import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import { AuthProvider } from '../auth/AuthProvider';
import { jsonResponse, mockFetch, renderWithQueryClient } from '../test/utils';

const user = {
  id: 'u1',
  email: 'ada@example.com',
  name: 'Ada',
  createdAt: '2026-01-01T00:00:00.000Z',
};
const emptyPage = { data: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 } };

function renderApp() {
  return renderWithQueryClient(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
}

describe('sign in', () => {
  it('shows the server error for bad credentials', async () => {
    mockFetch(
      jsonResponse(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        401,
      ),
    );
    renderApp();
    const u = userEvent.setup();

    await u.type(screen.getByLabelText('Email'), 'ada@example.com');
    await u.type(screen.getByLabelText('Password'), 'wrong');
    await u.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('stores the token and shows the task list after signing in', async () => {
    const fetchMock = mockFetch(
      jsonResponse({ token: 'jwt-token', user }),
      jsonResponse(emptyPage),
      jsonResponse({ data: [] }),
    );
    renderApp();
    const u = userEvent.setup();

    await u.type(screen.getByLabelText('Email'), 'ada@example.com');
    await u.type(screen.getByLabelText('Password'), 'analytical-engine');
    await u.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'My tasks' })).toBeInTheDocument();
    expect(await screen.findByText('No tasks yet')).toBeInTheDocument();
    expect(localStorage.getItem('taskflow.token')).toBe('jwt-token');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/auth/login');
  });

  it('switches to the registration form', async () => {
    renderApp();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Create one' }));
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });
});
