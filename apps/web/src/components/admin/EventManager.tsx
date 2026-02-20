import { useAuth } from '@clerk/astro/react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

interface EventData {
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

const EVENT_TYPES = ['workshop', 'minigame', 'ceremony', 'meal', 'general'] as const;

const TYPE_COLORS: Record<string, string> = {
  workshop: 'text-gold',
  minigame: 'text-burgundy-light',
  ceremony: 'text-gold',
  meal: 'text-teal-light',
  general: 'text-text-secondary',
};

const emptyForm = {
  title: '',
  description: '',
  event_type: 'general',
  location: '',
  starts_at: '',
  ends_at: '',
  capacity: '',
};

export default function EventManager() {
  const { getToken } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchEvents = async () => {
    try {
      const token = await getToken();
      const data = await apiFetch<EventData[]>('/api/v1/events', {}, token);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (event: EventData) => {
    setForm({
      title: event.title,
      description: event.description ?? '',
      event_type: event.event_type,
      location: event.location ?? '',
      starts_at: event.starts_at.slice(0, 16), // for datetime-local input
      ends_at: event.ends_at.slice(0, 16),
      capacity: event.capacity?.toString() ?? '',
    });
    setEditingId(event.id);
    setShowForm(true);
  };

  const handleSave = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      const payload = {
        title: form.title,
        description: form.description || null,
        event_type: form.event_type,
        location: form.location || null,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
        capacity: form.capacity ? parseInt(form.capacity) : null,
      };

      if (editingId) {
        await apiFetch<EventData>(`/api/v1/events/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }, token);
      } else {
        await apiFetch<EventData>('/api/v1/events', {
          method: 'POST',
          body: JSON.stringify(payload),
        }, token);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    try {
      const token = await getToken();
      await apiFetch(`/api/v1/events/${eventId}`, { method: 'DELETE' }, token);
      await fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {error && (
        <div className="border border-suit-red/30 bg-suit-red/10 px-4 py-3 font-mono text-sm text-suit-red">
          {error}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-text-muted">
          {events.length} event{events.length !== 1 && 's'} scheduled
        </span>
        <button
          onClick={openCreate}
          className="border border-gold bg-gold/10 px-4 py-2 font-mono text-xs tracking-wider text-gold transition-colors hover:bg-gold/20"
        >
          + ADD EVENT
        </button>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <form onSubmit={handleSave} className="border border-base-border bg-base-card">
          <div className="border-b border-base-border bg-base-dark px-6 py-3">
            <span className="font-mono text-xs tracking-widest text-text-muted">
              {editingId ? 'EDIT' : 'CREATE'} // EVENT
            </span>
          </div>

          <div className="space-y-4 p-6">
            <input
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              required
              placeholder="Event title"
              className="w-full border border-base-border bg-base-dark px-3 py-2 font-mono text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-gold"
            />

            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Description"
              rows={2}
              className="w-full border border-base-border bg-base-dark px-3 py-2 font-mono text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-gold"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block font-mono text-xs tracking-wider text-text-secondary">
                  Type
                </label>
                <select
                  value={form.event_type}
                  onChange={(e) => updateField('event_type', e.target.value)}
                  className="w-full border border-base-border bg-base-dark px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-gold"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <input
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="Location"
                className="border border-base-border bg-base-dark px-3 py-2 font-mono text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-gold"
              />

              <div>
                <label className="mb-1 block font-mono text-xs tracking-wider text-text-secondary">
                  Start
                </label>
                <input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => updateField('starts_at', e.target.value)}
                  required
                  className="w-full border border-base-border bg-base-dark px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-xs tracking-wider text-text-secondary">
                  End
                </label>
                <input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => updateField('ends_at', e.target.value)}
                  required
                  className="w-full border border-base-border bg-base-dark px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-gold"
                />
              </div>

              <input
                type="number"
                value={form.capacity}
                onChange={(e) => updateField('capacity', e.target.value)}
                placeholder="Capacity (optional)"
                className="border border-base-border bg-base-dark px-3 py-2 font-mono text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-gold"
              />
            </div>
          </div>

          <div className="flex gap-3 border-t border-base-border bg-base-dark px-6 py-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 border border-gold bg-gold/10 px-4 py-2 font-mono text-sm tracking-wider text-gold transition-colors hover:bg-gold/20 disabled:opacity-50"
            >
              {saving ? '// SAVING...' : editingId ? 'UPDATE' : 'CREATE'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="border border-base-border px-4 py-2 font-mono text-sm tracking-wider text-text-muted transition-colors hover:text-text-primary"
            >
              CANCEL
            </button>
          </div>
        </form>
      )}

      {/* Events list */}
      <div className="border border-base-border bg-base-card">
        <div className="border-b border-base-border bg-base-dark px-6 py-3">
          <span className="font-mono text-xs tracking-widest text-text-muted">
            SCHEDULE // ALL EVENTS
          </span>
        </div>

        {loading ? (
          <div className="p-6 text-center font-mono text-sm text-text-muted">// loading...</div>
        ) : events.length === 0 ? (
          <div className="p-6 text-center font-mono text-sm text-text-muted">
            // no events scheduled yet
          </div>
        ) : (
          <div className="divide-y divide-base-border">
            {events.map((event) => (
              <div key={event.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-sm font-bold text-text-primary">{event.title}</p>
                    <span
                      className={`font-mono text-[10px] tracking-wider ${TYPE_COLORS[event.event_type] ?? 'text-text-muted'}`}
                    >
                      [{event.event_type.toUpperCase()}]
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-text-muted">
                    {new Date(event.starts_at).toLocaleString()} —{' '}
                    {new Date(event.ends_at).toLocaleTimeString()}
                    {event.location && ` @ ${event.location}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(event)}
                    className="border border-base-border px-3 py-1 font-mono text-xs text-text-muted transition-colors hover:text-text-primary"
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="border border-suit-red/30 px-3 py-1 font-mono text-xs text-suit-red/50 transition-colors hover:bg-suit-red/10 hover:text-suit-red"
                  >
                    DEL
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
