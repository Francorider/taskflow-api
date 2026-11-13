import { apiRequest } from './client';
import type { AuthResponse, Page, TagCount, Task, TaskInput, TaskQuery, User } from './types';

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }),
  register: (name: string, email: string, password: string) =>
    apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: { name, email, password } }),
  me: () => apiRequest<User>('/auth/me'),
};

export const tasksApi = {
  list: (query: TaskQuery) => apiRequest<Page<Task>>('/tasks', { query: { ...query } }),
  create: (input: TaskInput) => apiRequest<Task>('/tasks', { method: 'POST', body: input }),
  update: (id: string, patch: Partial<TaskInput>) =>
    apiRequest<Task>(`/tasks/${id}`, { method: 'PATCH', body: patch }),
  remove: (id: string) => apiRequest<undefined>(`/tasks/${id}`, { method: 'DELETE' }),
  tags: () => apiRequest<{ data: TagCount[] }>('/tags'),
};
