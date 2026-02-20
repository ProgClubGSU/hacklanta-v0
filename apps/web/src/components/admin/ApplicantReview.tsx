import { useAuth } from '@clerk/astro/react';
import { useState } from 'react';
import { apiFetch } from '../../lib/api';
import type { ApplicationData } from '../dashboard/ApplicationForm';

interface Props {
  application: ApplicationData;
  onClose: () => void;
  onUpdated: (updated: ApplicationData) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-gold',
  accepted: 'text-neon-green',
  rejected: 'text-suit-red',
  waitlisted: 'text-cyan',
};

export default function ApplicantReview({ application, onClose, onUpdated }: Props) {
  const { getToken } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    setError(null);
    try {
      const token = await getToken();
      const updated = await apiFetch<ApplicationData>(
        `/api/v1/applications/${application.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus }),
        },
        token,
      );
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  const handleResumeClick = async (resumeKey: string) => {
    try {
      const token = await getToken();
      const response = await apiFetch<{ download_url: string }>(
        `/api/v1/applications/download-url/${resumeKey}`,
        {},
        token,
      );
      // Open the presigned URL in a new tab
      window.open(response.download_url, '_blank');
    } catch {
      setError('Failed to download resume');
    }
  };

  return (
    <div className="border border-base-border bg-base-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-base-border bg-base-dark px-6 py-3">
        <span className="font-mono text-xs tracking-widest text-text-muted">
          HACKLANTA // REVIEW PANEL
        </span>
        <button
          onClick={onClose}
          className="font-mono text-xs text-text-muted transition-colors hover:text-text-primary"
        >
          [x] close
        </button>
      </div>

      <div className="p-6">
        {/* Status */}
        <div className="mb-6 flex items-center justify-between">
          <span className="font-mono text-xs text-text-muted">Current status:</span>
          <span className={`font-mono text-sm font-bold ${STATUS_COLORS[application.status] ?? 'text-text-secondary'}`}>
            {application.status.toUpperCase()}
          </span>
        </div>

        {/* Details grid */}
        <div className="space-y-3 border-t border-base-border pt-4">
          <DetailRow label="ID" value={application.id.slice(0, 8)} mono />
          <DetailRow label="University" value={application.university} />
          <DetailRow label="Major" value={application.major} />
          <DetailRow label="Year" value={application.year_of_study} />
          <DetailRow label="Experience" value={application.experience_level ?? '—'} />
          <DetailRow label="T-Shirt" value={application.tshirt_size ?? '—'} />
          <DetailRow label="Dietary" value={application.dietary_restrictions ?? '—'} />
          {application.github_url && (
            <DetailRow label="GitHub" value={application.github_url} link />
          )}
          {application.linkedin_url && (
            <DetailRow label="LinkedIn" value={application.linkedin_url} link />
          )}
          {application.resume_url && (
            <DetailRow
              label="Resume"
              value={application.resume_url}
              resumeLink
              onResumeClick={handleResumeClick}
            />
          )}
        </div>

        {/* Why attend */}
        {application.why_attend && (
          <div className="mt-4 border-t border-base-border pt-4">
            <p className="mb-2 font-mono text-xs text-text-muted">Why attend:</p>
            <p className="font-mono text-sm leading-relaxed text-text-secondary break-words whitespace-pre-wrap">
              {application.why_attend}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 border border-suit-red/30 bg-suit-red/10 px-4 py-2 font-mono text-xs text-suit-red">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex gap-3">
          <ActionButton
            label="$ ACCEPT"
            onClick={() => handleStatusUpdate('accepted')}
            disabled={updating || application.status === 'accepted'}
            className="border-neon-green bg-neon-green/10 text-neon-green hover:bg-neon-green/20"
          />
          <ActionButton
            label="$ WAITLIST"
            onClick={() => handleStatusUpdate('waitlisted')}
            disabled={updating || application.status === 'waitlisted'}
            className="border-cyan bg-cyan/10 text-cyan hover:bg-cyan/20"
          />
          <ActionButton
            label="$ REJECT"
            onClick={() => handleStatusUpdate('rejected')}
            disabled={updating || application.status === 'rejected'}
            className="border-suit-red bg-suit-red/10 text-suit-red hover:bg-suit-red/20"
          />
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
  link = false,
  resumeLink = false,
  onResumeClick,
}: {
  label: string;
  value: string;
  mono?: boolean;
  link?: boolean;
  resumeLink?: boolean;
  onResumeClick?: (key: string) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 font-mono text-sm">
      <span className="text-text-muted shrink-0">{label}</span>
      {resumeLink && onResumeClick ? (
        <button
          onClick={() => onResumeClick(value)}
          className="text-neon-green-dim transition-colors hover:text-neon-green break-all text-right"
        >
          {value.length > 40 ? value.slice(0, 40) + '...' : value}
        </button>
      ) : link ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-neon-green-dim transition-colors hover:text-neon-green break-all text-right"
        >
          {value.length > 40 ? value.slice(0, 40) + '...' : value}
        </a>
      ) : (
        <span className={`break-words text-right ${mono ? 'text-gold' : 'text-text-primary'}`}>
          {value}
        </span>
      )}
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  className,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  className: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 border px-4 py-2 font-mono text-xs font-bold tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-30 ${className}`}
    >
      {label}
    </button>
  );
}
