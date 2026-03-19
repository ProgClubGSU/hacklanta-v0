import { clerk } from './clerk';

const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  // Wait for clerk to be loaded, checking repeatedly is a simple fallback for SPA
  if (!window.Clerk) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const token = await window.Clerk?.session?.getToken();
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(errorBody.detail || 'API Request Failed');
    (error as any).status = response.status;
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  // Profiles
  getProfile: () => fetchWithAuth('/profiles/me'),
  upsertProfile: (data: any) => fetchWithAuth('/profiles/me', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  listProfiles: () => fetchWithAuth('/profiles?looking_for_team_only=true'),

  // Teams
  createTeam: (data: any) => fetchWithAuth('/teams', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMyTeam: () => fetchWithAuth('/teams/me'),
  joinTeam: (data: { invite_code: string }) => fetchWithAuth('/teams/join', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  leaveTeam: () => fetchWithAuth('/teams/leave', {
    method: 'POST',
  }),
};
