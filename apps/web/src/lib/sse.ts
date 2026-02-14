// SSE client for real-time announcements
// TODO: Implement useSSE hook with EventSource subscription

const API_BASE = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:8000';

export function createAnnouncementSource(): EventSource {
  return new EventSource(`${API_BASE}/api/v1/announcements/stream`);
}
