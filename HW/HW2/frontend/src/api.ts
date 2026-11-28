const apiOrigin = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3002';

export class ApiError extends Error {
  constructor(readonly status: number, readonly code?: string, message?: string) {
    super(message || `Request failed (HTTP ${status}).`);
  }
}

export async function requestApi<T>(path: string, signal: AbortSignal, body?: object): Promise<T> {
  const response = await fetch(new URL(path, apiOrigin), {
    signal,
    cache: 'no-store',
    ...(body && { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new ApiError(response.status, result?.error?.code, result?.error?.message);
  }
  return response.json();
}
