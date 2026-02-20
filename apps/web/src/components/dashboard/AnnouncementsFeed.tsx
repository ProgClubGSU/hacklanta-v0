import { useAuth } from '@clerk/astro/react';
import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../../lib/api';

interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: string;
  created_by: string | null;
  created_at: string;
}

const PRIORITY_CONFIG: Record<string, { color: string; glow: string; badge: string }> = {
  urgent: {
    color: 'border-l-suit-red',
    glow: 'shadow-[0_0_10px_rgba(196,36,74,0.22)]',
    badge: 'bg-suit-red/20 text-suit-red',
  },
  normal: {
    color: 'border-l-gold',
    glow: '',
    badge: 'bg-gold/20 text-gold',
  },
  low: {
    color: 'border-l-text-muted',
    glow: '',
    badge: 'bg-base-dark text-text-muted',
  },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AnnouncementsFeed() {
  const { getToken } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Initial load via REST
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const token = await getToken();
        const data = await apiFetch<Announcement[]>('/api/v1/announcements', {}, token);
        setAnnouncements(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load announcements');
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  // SSE connection for real-time updates
  useEffect(() => {
    const apiBase = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:8000';
    const es = new EventSource(`${apiBase}/api/v1/announcements/stream`);
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.addEventListener('announcement', (event) => {
      try {
        const announcement: Announcement = JSON.parse(event.data);
        setAnnouncements((prev) => [announcement, ...prev]);
      } catch {
        // Ignore parse errors from keepalive comments
      }
    });

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, []);

  if (loading) {
    return (
      <div className="mt-8 text-center font-mono text-sm text-text-muted">
        // loading announcements...
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Connection status */}
      <div className="flex items-center gap-2 font-mono text-xs">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            connected ? 'bg-gold animate-pulse' : 'bg-suit-red'
          }`}
        />
        <span className="text-text-muted">
          {connected ? 'LIVE FEED CONNECTED' : 'RECONNECTING...'}
        </span>
      </div>

      {error && (
        <div className="border border-suit-red/30 bg-suit-red/10 px-4 py-3 font-mono text-sm text-suit-red">
          {error}
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="border border-base-border bg-base-card p-8 text-center">
          <p className="font-mono text-sm text-text-muted">// no announcements yet</p>
          <p className="mt-1 font-mono text-xs text-text-muted">
            stay tuned — broadcasts will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const cfg = PRIORITY_CONFIG[a.priority] ?? PRIORITY_CONFIG.normal;
            return (
              <div
                key={a.id}
                className={`border border-base-border border-l-4 ${cfg.color} ${cfg.glow} bg-base-card`}
              >
                <div className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <h4 className="font-display text-sm font-bold text-text-primary">{a.title}</h4>
                    <span
                      className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] tracking-wider ${cfg.badge}`}
                    >
                      {a.priority.toUpperCase()}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-text-muted">
                      {timeAgo(a.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-xs leading-relaxed text-text-secondary">
                    {a.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
