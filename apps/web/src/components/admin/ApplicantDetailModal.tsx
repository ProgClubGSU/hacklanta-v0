import { useEffect, useState } from 'react';
import type { Application } from '../../lib/admin-api';

function normalizeHref(value: string | null | undefined) {
  if (!value?.trim()) return '';
  if (/^http:\/\//i.test(value)) return value.replace(/^http:/i, 'https:');
  return /^https:\/\//i.test(value) ? value : `https://${value}`;
}

interface ApplicantDetailModalProps {
  application: Application;
  onClose: () => void;
  onStatusChange: (appId: string, newStatus: string, sendEmail: boolean) => Promise<void>;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'accepted_overflow', label: 'Accepted (Overflow)' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'waitlisted', label: 'Waitlisted' },
];

const STATUS_STYLES: Record<string, string> = {
  pending: 'text-gold border-gold/30 bg-gold/10',
  accepted: 'text-[#00ff88] border-[#00ff88]/30 bg-[#00ff88]/10',
  accepted_overflow: 'text-gold border-gold/30 bg-gold/10',
  rejected: 'text-red-bright border-red-bright/30 bg-red-bright/10',
  waitlisted: 'text-gold border-gold/30 bg-gold/10',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{children}</span>
  );
}

function FieldValue({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-white/80">{children}</p>;
}

export default function ApplicantDetailModal({ application, onClose, onStatusChange }: ApplicantDetailModalProps) {
  const [newStatus, setNewStatus] = useState(application.status);
  const [sendEmail, setSendEmail] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleUpdate = async () => {
    if (newStatus === application.status && !sendEmail) {
      onClose();
      return;
    }

    setIsUpdating(true);
    setError(null);
    try {
      await onStatusChange(application.id, newStatus, sendEmail);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const userName = application.user
    ? `${application.user.first_name ?? ''} ${application.user.last_name ?? ''}`.trim() || application.user.email
    : application.email;
  const email = application.user?.email ?? application.email;
  const statusStyle = STATUS_STYLES[application.status] ?? 'text-white/50 border-white/20 bg-white/5';
  const statusLabel = application.status === 'accepted_overflow' ? 'overflow admit' : application.status;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-2xl overflow-y-auto rounded-lg border border-white/10 bg-black-card max-h-[90vh]">
        {/* Header */}
        <div className="border-b border-white/10 px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {application.user?.avatar_url && (
                <img
                  src={application.user.avatar_url}
                  alt={userName}
                  className="h-12 w-12 rounded-full border-2 border-red/30"
                />
              )}
              <div>
                <h2 className="font-display text-2xl tracking-wide text-white-pure">{userName}</h2>
                <p className="mt-0.5 font-mono text-xs text-white/50">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-block rounded border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${statusStyle}`}
              >
                {statusLabel}
              </span>
              <button onClick={onClose} className="text-white/40 transition-colors hover:text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <p className="mt-2 font-mono text-[10px] text-white/30">
            Applied {formatDate(application.created_at)}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Academic Info */}
          <div>
            <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-red/80">Academic Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>University</FieldLabel>
                <FieldValue>{application.university}</FieldValue>
              </div>
              <div>
                <FieldLabel>Major</FieldLabel>
                <FieldValue>{application.major}</FieldValue>
              </div>
              <div>
                <FieldLabel>Year of Study</FieldLabel>
                <FieldValue>{application.year_of_study}</FieldValue>
              </div>
              <div>
                <FieldLabel>Graduation Date</FieldLabel>
                <FieldValue>{formatDate(application.graduation_date)}</FieldValue>
              </div>
              <div>
                <FieldLabel>Experience Level</FieldLabel>
                <FieldValue>{application.experience_level ?? '\u2014'}</FieldValue>
              </div>
            </div>
          </div>

          {/* Links */}
          {(application.resume_url || application.github_url || application.linkedin_url) && (
            <div>
              <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-red/80">Links</h3>
              <div className="flex flex-wrap gap-3">
                {application.resume_url && (
                  <a
                    href={application.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-white/70 transition-colors hover:border-red/40 hover:text-white"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Resume
                  </a>
                )}
                {application.github_url && (
                  <a
                    href={normalizeHref(application.github_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-white/70 transition-colors hover:border-red/40 hover:text-white"
                  >
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </a>
                )}
                {application.linkedin_url && (
                  <a
                    href={normalizeHref(application.linkedin_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-white/70 transition-colors hover:border-red/40 hover:text-white"
                  >
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Why Attend */}
          {application.why_attend && (
            <div>
              <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-red/80">Why Attend</h3>
              <div className="rounded border border-white/10 bg-black/30 p-4">
                <p className="text-sm leading-relaxed text-white/70 italic">"{application.why_attend}"</p>
              </div>
            </div>
          )}

          {/* Other Details */}
          <div>
            <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-red/80">Other Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Dietary Restrictions</FieldLabel>
                <FieldValue>{application.dietary_restrictions ?? 'None'}</FieldValue>
              </div>
              <div>
                <FieldLabel>T-Shirt Size</FieldLabel>
                <FieldValue>{application.tshirt_size ?? '\u2014'}</FieldValue>
              </div>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <FieldValue>{application.phone_number ?? '\u2014'}</FieldValue>
              </div>
              <div>
                <FieldLabel>How Did You Hear</FieldLabel>
                <FieldValue>{application.how_did_you_hear ?? '\u2014'}</FieldValue>
              </div>
            </div>
          </div>

          {/* Review Info */}
          {(application.reviewed_by || application.reviewed_at) && (
            <div>
              <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-red/80">Review Info</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Reviewed By</FieldLabel>
                  <FieldValue>{application.reviewed_by ?? '\u2014'}</FieldValue>
                </div>
                <div>
                  <FieldLabel>Reviewed At</FieldLabel>
                  <FieldValue>{formatDate(application.reviewed_at)}</FieldValue>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-white/10 pt-5">
            <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-red/80">Actions</h3>

            {error && (
              <div className="mb-3 rounded border border-red-bright/30 bg-red-bright/10 px-3 py-2 text-sm text-red-bright">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                disabled={isUpdating}
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
                  disabled={isUpdating}
                  className="h-3.5 w-3.5 accent-red"
                />
                Send email
              </label>

              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="rounded border border-red/50 bg-red/20 px-5 py-2 font-mono text-xs uppercase tracking-wider text-red transition-colors hover:bg-red/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUpdating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
