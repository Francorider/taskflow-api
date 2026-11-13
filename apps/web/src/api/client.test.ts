import { describe, expect, it } from 'vitest';
import { jsonResponse, mockFetch } from '../test/utils';
import { ApiError, apiRequest, buildUrl, tokenStore } from './client';

describe('buildUrl', () => {
  it('drops empty and undefined query values', () => {
    expect(buildUrl('/tasks', { page: 2, status: undefined, search: '', tags: 'a,b' })).toBe(
      '/api/tasks?page=2&tags=a%2Cb',
    );
  });
});

describe('apiRequest', () => {
  it('sends the stored token and JSON body', async () => {
    tokenStore.set('abc.def.ghi');
    const fetchMock = mockFetch(jsonResponse({ ok: true }));

    await apiRequest('/tasks', { method: 'POST', body: { title: 'x' } });

    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer abc.def.ghi',
      'Content-Type': 'application/json',
    });
    expect(init?.body).toBe('{"title":"x"}');
  });

  it('turns error responses into ApiError with the server code', async () => {
    mockFetch(jsonResponse({ error: { code: 'NOT_FOUND', message: 'Task not found' } }, 404));

    const error: unknown = await apiRequest('/tasks/1').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, code: 'NOT_FOUND', message: 'Task not found' });
  });

  it('resolves to undefined for 204 responses', async () => {
    mockFetch(new Response(null, { status: 204 }));
    await expect(apiRequest('/tasks/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });
});
