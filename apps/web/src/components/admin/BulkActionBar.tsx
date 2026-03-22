import { useState } from 'react';

interface BulkActionBarProps {
  selectedCount: number;
  onUpdateStatus: (newStatus: string, sendEmail: boolean) => Promise<void>;
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

  const handleApply = async () => {
    const statusLabel = STATUS_OPTIONS.find((o) => o.value === newStatus)?.label ?? newStatus;
    const emailNote = sendEmail ? ' + Send notification emails' : '';
    const confirmed = window.confirm(
      `Update ${selectedCount} application${selectedCount !== 1 ? 's' : ''} to ${statusLabel}?${emailNote}`
    );
    if (!confirmed) return;

    setIsApplying(true);
    setError(null);
    try {
      await onUpdateStatus(newStatus, sendEmail);
      onClearSelection();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update statuses');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-black-card/95 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md border-t border-red/30">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <span className="font-mono text-sm text-red">
          {selectedCount} selected
        </span>

        <div className="flex items-center gap-4">
          {error && (
            <span className="font-mono text-xs text-red-bright">{error}</span>
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
            onClick={onClearSelection}
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
