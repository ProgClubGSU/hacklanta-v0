import { useAuth } from '@clerk/astro/react';
import { useState } from 'react';
import { apiFetch } from '../../lib/api';
import type { PaginatedResponse } from '../../lib/api';
import type { ApplicationData } from '../dashboard/ApplicationForm';

const TEMPLATE_OPTIONS = [
  { value: 'application_accepted', label: 'Accepted' },
  { value: 'application_rejected', label: 'Rejected' },
  { value: 'application_waitlisted', label: 'Waitlisted' },
] as const;

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'waitlisted', label: 'Waitlisted' },
] as const;

interface BulkResult {
  updated: number;
  failed: number;
  total: number;
}

export default function EmailComposer() {
  const { getToken } = useAuth();
  const [targetStatus, setTargetStatus] = useState('pending');
  const [newStatus, setNewStatus] = useState('accepted');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [preview, setPreview] = useState<{ total: number } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const fetchPreview = async () => {
    setLoadingPreview(true);
    try {
      const token = await getToken();
      const data = await apiFetch<PaginatedResponse<ApplicationData>>(
        `/api/v1/applications?status=${targetStatus}&page_size=1`,
        {},
        token,
      );
      setPreview({ total: data.meta.total });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleBulkAction = async () => {
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const token = await getToken();

      // First fetch all application IDs matching the filter
      const data = await apiFetch<PaginatedResponse<ApplicationData>>(
        `/api/v1/applications?status=${targetStatus}&page_size=100`,
        {},
        token,
      );

      if (data.data.length === 0) {
        setError('No applications match this filter.');
        setSending(false);
        return;
      }

      const ids = data.data.map((app) => app.id);

      // Send bulk update (which triggers emails)
      const bulkResult = await apiFetch<BulkResult>(
        '/api/v1/applications/bulk',
        {
          method: 'POST',
          body: JSON.stringify({ application_ids: ids, status: newStatus }),
        },
        token,
      );

      setResult(bulkResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk action failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Bulk action form */}
      <div className="border border-base-border bg-base-card">
        <div className="border-b border-base-border bg-base-dark px-6 py-3">
          <span className="font-mono text-xs tracking-widest text-text-muted">
            BULK ACTIONS // STATUS + EMAIL
          </span>
        </div>

        <div className="space-y-4 p-6">
          <p className="font-mono text-xs text-text-muted">
            Select applications by current status, then set their new status. Status change emails
            will be sent automatically.
          </p>

          {/* Target status */}
          <div>
            <label className="mb-1 block font-mono text-xs tracking-wider text-text-secondary">
              Target applications with status:
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTER_OPTIONS.filter((o) => o.value !== '').map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setTargetStatus(opt.value);
                    setPreview(null);
                    setResult(null);
                  }}
                  className={`border px-3 py-1.5 font-mono text-xs tracking-wider transition-colors ${
                    targetStatus === opt.value
                      ? 'border-gold bg-gold/20 text-gold'
                      : 'border-base-border text-text-muted hover:text-text-primary'
                  }`}
                >
                  {opt.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* New status */}
          <div>
            <label className="mb-1 block font-mono text-xs tracking-wider text-text-secondary">
              Set new status to:
            </label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNewStatus(opt.value.replace('application_', ''))}
                  className={`border px-3 py-1.5 font-mono text-xs tracking-wider transition-colors ${
                    newStatus === opt.value.replace('application_', '')
                      ? opt.value.includes('accepted')
                        ? 'border-neon-green bg-neon-green/20 text-neon-green'
                        : opt.value.includes('rejected')
                          ? 'border-suit-red bg-suit-red/20 text-suit-red'
                          : 'border-cyan bg-cyan/20 text-cyan'
                      : 'border-base-border text-text-muted hover:text-text-primary'
                  }`}
                >
                  {opt.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-4">
            <button
              onClick={fetchPreview}
              disabled={loadingPreview}
              className="border border-base-border bg-base-dark px-4 py-2 font-mono text-xs tracking-wider text-text-muted transition-colors hover:text-text-primary disabled:opacity-50"
            >
              {loadingPreview ? '...' : 'PREVIEW COUNT'}
            </button>
            {preview && (
              <span className="font-mono text-sm text-gold">
                {preview.total} application{preview.total !== 1 && 's'} will be affected
              </span>
            )}
          </div>

          {error && (
            <div className="border border-suit-red/30 bg-suit-red/10 px-4 py-3 font-mono text-sm text-suit-red">
              {error}
            </div>
          )}

          {result && (
            <div className="border border-neon-green/30 bg-neon-green/10 px-4 py-3 font-mono text-sm text-neon-green">
              Done: {result.updated} updated, {result.failed} failed out of {result.total} total.
              Status emails have been queued.
            </div>
          )}
        </div>

        <div className="border-t border-base-border bg-base-dark px-6 py-4">
          <button
            onClick={handleBulkAction}
            disabled={sending}
            className="w-full border-2 border-gold bg-gold/10 px-6 py-3 font-mono text-sm font-bold tracking-wider text-gold transition-all hover:bg-gold/20 hover:shadow-[0_0_20px_rgba(255,215,0,0.2)] disabled:opacity-50"
          >
            {sending ? '// PROCESSING...' : `$ BULK_${newStatus.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
