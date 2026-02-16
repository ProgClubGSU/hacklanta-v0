const API_BASE = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:8000';

export interface ApiError {
  detail: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; page_size: number; total_pages: number };
}

/**
 * Typed fetch wrapper for the Hacklanta API.
 *
 * Pass a Clerk session token to make authenticated requests.
 * In React islands, get it from `useAuth().getToken()`.
 * In .astro pages, get it from `Astro.locals.auth().getToken()`.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? `API error: ${res.status}`);
  }

  return res.json();
}
