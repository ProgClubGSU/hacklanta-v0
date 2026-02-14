const API_BASE = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:8000';

interface ApiResponse<T> {
  data: T;
  meta?: { total: number; page: number };
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      // TODO: Attach Clerk session token via getToken()
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
