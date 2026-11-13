import { ApiError } from '../api/client';

/** A user-facing message for any thrown value, including per-field validation details. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'VALIDATION_ERROR' && Array.isArray(error.details)) {
      const messages = (error.details as { path?: string; message?: string }[])
        .map((d) => [d.path?.replace(/^\//, ''), d.message].filter(Boolean).join(': '))
        .filter(Boolean);
      if (messages.length > 0) return messages.join('. ');
    }
    return error.message;
  }
  if (error instanceof TypeError) return 'Could not reach the server. Check your connection.';
  return 'Something went wrong. Please try again.';
}
