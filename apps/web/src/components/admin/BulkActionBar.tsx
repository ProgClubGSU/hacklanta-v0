import { useState } from 'react';
import type { UpdateStatusResult } from '../../lib/admin-api';

interface BulkActionBarProps {
  selectedCount: number;
  onUpdateStatus: (newStatus: string, sendEmail: boolean) => Promise<UpdateStatusResult>;
  onClearSelection: () => void;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'accepted_overflow', label: 'Accepted (Overflow)' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'waitlisted', label: 'Waitlisted' },
];

export default function BulkActionBar({ selectedCount, onUpdateStatus, onClearSelection }: BulkActionBarProps) {
  const [newStatus, setNewStatus] = useState('accepted');
  const [sendEmail, setSendEmail] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UpdateStatusResult | null>(null);

  const handleApply = async () => {
    const statusLabel = STATUS_OPTIONS.find((o) => o.value === newStatus)?.label ?? newStatus;
    const emailNote = sendEmail ? ' + Send notification emails' : '';
    const confirmed = window.confirm(
      `Update ${selectedCount} application${selectedCount !== 1 ? 's' : ''} to ${statusLabel}?${emailNote}`
    );
    if (!confirmed) return;

    setIsApplying(true);
    setError(null);
    setResult(null);
    try {
      const res = await onUpdateStatus(newStatus, sendEmail);
      setResult(res);

      // If there's an email error, show it
      if (res.email_error) {
        setError(`Email error: ${res.email_error}`);
      } else if (res.emails_failed > 0) {
        setError(`${res.emails_failed} email(s) failed to send`);
      } else {
        // Success — clear selection after a short delay so user can see the result
        setTimeout(() => {
          onClearSelection();
          setResult(null);
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update statuses');
    } finally {
      setIsApplying(false);
    }
  };

  const handleClear = () => {
    setResult(null);
    setError(null);
    onClearSelection();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-black-card/95 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md border-t border-red/30">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <span className="font-mono text-sm text-red">
          {selectedCount} selected
        </span>

        <div className="flex items-center gap-4">
          {/* Result feedback */}
          {result && !error && (
            <span className="font-mono text-xs text-green-400">
              Updated {result.updated}
              {result.emails_sent > 0 && ` · ${result.emails_sent} email${result.emails_sent !== 1 ? 's' : ''} sent`}
            </span>
          )}

          {error && (
            <span className="font-mono text-xs text-red-bright max-w-md truncate" title={error}>{error}</span>
          )}

          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            disabled={isApplying}
            className="rounded border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white focus:border-red focus:outline-none disabled:opacity-50"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 font-mono text-xs text-white/60">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              disabled={isApplying}
              className="h-3.5 w-3.5 accent-red"
            />
            Send email
          </label>

          <button
            onClick={handleApply}
            disabled={isApplying}
            className="rounded border border-red/50 bg-red/20 px-5 py-2 font-mono text-xs uppercase tracking-wider text-red transition-colors hover:bg-red/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isApplying ? 'Applying...' : 'Apply'}
          </button>

          <button
            onClick={handleClear}
            disabled={isApplying}
            className="rounded border border-white/10 bg-white/5 px-4 py-2 font-mono text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white/70 disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
