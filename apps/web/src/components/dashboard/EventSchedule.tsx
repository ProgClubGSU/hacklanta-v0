import { useAuth } from '@clerk/astro/react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  location: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { color: string; glow: string; label: string }> = {
  workshop: { color: 'text-gold', glow: 'border-l-gold', label: 'WORKSHOP' },
  minigame: { color: 'text-burgundy-light', glow: 'border-l-burgundy', label: 'MINIGAME' },
  ceremony: { color: 'text-gold', glow: 'border-l-gold', label: 'CEREMONY' },
  meal: { color: 'text-teal-light', glow: 'border-l-teal', label: 'MEAL' },
  general: { color: 'text-text-secondary', glow: 'border-l-text-secondary', label: 'GENERAL' },
};

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function EventSchedule() {
  const { getToken } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = await getToken();
        const data = await apiFetch<Event[]>('/api/v1/events', {}, token);
        setEvents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load schedule');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="mt-8 text-center font-mono text-sm text-text-muted">
        // loading schedule...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 border border-suit-red/30 bg-suit-red/10 px-4 py-3 font-mono text-sm text-suit-red">
        {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="mt-8 border border-base-border bg-base-card p-8 text-center">
        <p className="font-mono text-sm text-text-muted">// schedule not published yet</p>
        <p className="mt-1 font-mono text-xs text-text-muted">check back closer to the event</p>
      </div>
    );
  }

  // Group events by date
  const grouped: Record<string, Event[]> = {};
  for (const event of events) {
    const dateKey = formatDate(event.starts_at);
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(event);
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Type legend */}
      <div className="flex flex-wrap gap-4 font-mono text-xs">
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
          <span key={type} className={`${cfg.color} flex items-center gap-1.5`}>
            <span className="inline-block h-2 w-2 rounded-full bg-current" />
            {cfg.label}
          </span>
        ))}
      </div>

      {Object.entries(grouped).map(([date, dayEvents]) => (
        <div key={date}>
          <div className="mb-3 flex items-center gap-3">
            <span className="font-mono text-xs tracking-widest text-gold">{date.toUpperCase()}</span>
            <div className="h-px flex-1 bg-base-border" />
          </div>

          <div className="space-y-2">
            {dayEvents.map((event) => {
              const cfg = TYPE_CONFIG[event.event_type] ?? TYPE_CONFIG.general;
              return (
                <div
                  key={event.id}
                  className={`border border-base-border border-l-4 ${cfg.glow} bg-base-card transition-colors hover:bg-base-dark`}
                >
                  <div className="flex items-start gap-4 px-5 py-4">
                    {/* Time column */}
                    <div className="w-24 shrink-0 font-mono text-xs text-text-muted">
                      <p>{formatTime(event.starts_at)}</p>
                      <p className="text-text-muted/50">{formatTime(event.ends_at)}</p>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-display text-sm font-bold text-text-primary">
                          {event.title}
                        </h4>
                        <span className={`font-mono text-[10px] tracking-wider ${cfg.color}`}>
                          [{cfg.label}]
                        </span>
                      </div>
                      {event.description && (
                        <p className="mt-1 font-mono text-xs text-text-muted">
                          {event.description}
                        </p>
                      )}
                      <div className="mt-2 flex gap-4 font-mono text-[10px] text-text-muted">
                        {event.location && <span>@ {event.location}</span>}
                        {event.capacity && <span>cap: {event.capacity}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
