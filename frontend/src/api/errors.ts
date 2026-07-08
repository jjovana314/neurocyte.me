import type { AxiosError } from 'axios';

interface ApiErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

export function getErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  const message = (err as AxiosError<ApiErrorBody>)?.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string' && message.length > 0) return message;
  return fallback;
}
