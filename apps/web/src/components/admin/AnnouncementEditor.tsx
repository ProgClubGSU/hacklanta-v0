import { useAuth } from '@clerk/astro/react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: string;
  created_by: string | null;
  created_at: string;
}

const PRIORITY_OPTIONS = ['low', 'normal', 'urgent'] as const;

export default function AnnouncementEditor() {
  const { getToken } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('normal');
  const [sending, setSending] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const token = await getToken();
      const data = await apiFetch<Announcement[]>('/api/v1/announcements', {}, token);
      setAnnouncements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSend = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const token = await getToken();
      await apiFetch<Announcement>(
        '/api/v1/announcements',
        { method: 'POST', body: JSON.stringify({ title, body, priority }) },
        token,
      );
      setTitle('');
      setBody('');
      setPriority('normal');
      await fetchAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Compose form */}
      <form onSubmit={handleSend} className="border border-base-border bg-base-card">
        <div className="border-b border-base-border bg-base-dark px-6 py-3">
          <span className="font-mono text-xs tracking-widest text-text-muted">
            COMPOSE // NEW BROADCAST
          </span>
        </div>

        <div className="space-y-4 p-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Announcement title"
            className="w-full border border-base-border bg-base-dark px-3 py-2 font-mono text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-gold"
          />

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            placeholder="Message body..."
            rows={4}
            className="w-full border border-base-border bg-base-dark px-3 py-2 font-mono text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-gold"
          />

          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-text-muted">PRIORITY:</span>
            {PRIORITY_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`border px-3 py-1 font-mono text-xs tracking-wider transition-colors ${
                  priority === p
                    ? p === 'urgent'
                      ? 'border-suit-red bg-suit-red/20 text-suit-red'
                      : p === 'normal'
                        ? 'border-gold bg-gold/20 text-gold'
                        : 'border-text-muted bg-base-dark text-text-muted'
                    : 'border-base-border text-text-muted hover:text-text-primary'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>

          {error && (
            <div className="border border-suit-red/30 bg-suit-red/10 px-4 py-3 font-mono text-sm text-suit-red">
              {error}
            </div>
          )}
        </div>

        <div className="border-t border-base-border bg-base-dark px-6 py-4">
          <button
            type="submit"
            disabled={sending}
            className="w-full border-2 border-gold bg-gold/10 px-6 py-3 font-mono text-sm font-bold tracking-wider text-gold transition-all hover:bg-gold/20 hover:shadow-[0_0_20px_rgba(232,180,79,0.3)] disabled:opacity-50"
          >
            {sending ? '// BROADCASTING...' : '$ BROADCAST'}
          </button>
        </div>
      </form>

      {/* Recent announcements */}
      <div className="border border-base-border bg-base-card">
        <div className="border-b border-base-border bg-base-dark px-6 py-3">
          <span className="font-mono text-xs tracking-widest text-text-muted">
            RECENT // {announcements.length} BROADCASTS
          </span>
        </div>

        {loading ? (
          <div className="p-6 text-center font-mono text-sm text-text-muted">// loading...</div>
        ) : announcements.length === 0 ? (
          <div className="p-6 text-center font-mono text-sm text-text-muted">
            // no announcements sent yet
          </div>
        ) : (
          <div className="divide-y divide-base-border">
            {announcements.map((a) => (
              <div key={a.id} className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <p className="font-display text-sm font-bold text-text-primary">{a.title}</p>
                  <span
                    className={`font-mono text-[10px] tracking-wider ${
                      a.priority === 'urgent'
                        ? 'text-suit-red'
                        : a.priority === 'normal'
                          ? 'text-gold'
                          : 'text-text-muted'
                    }`}
                  >
                    [{a.priority.toUpperCase()}]
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-text-muted">
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-text-muted">{a.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
