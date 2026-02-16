import type { ApplicationData } from './ApplicationForm';

const STATUS_CONFIG: Record<string, { label: string; color: string; glow: string; icon: string }> = {
  pending: {
    label: 'PENDING',
    color: 'text-gold',
    glow: 'shadow-[0_0_15px_rgba(198,149,63,0.22)]',
    icon: '\u23F3',
  },
  accepted: {
    label: 'ACCEPTED',
    color: 'text-gold',
    glow: 'shadow-[0_0_15px_rgba(232,180,79,0.22)]',
    icon: '\u2713',
  },
  rejected: {
    label: 'REJECTED',
    color: 'text-suit-red',
    glow: 'shadow-[0_0_15px_rgba(196,36,74,0.22)]',
    icon: '\u2717',
  },
  waitlisted: {
    label: 'WAITLISTED',
    color: 'text-teal-light',
    glow: 'shadow-[0_0_15px_rgba(20,168,138,0.22)]',
    icon: '\u2026',
  },
};

interface Props {
  application: ApplicationData;
}

export default function ApplicationStatus({ application }: Props) {
  const config = STATUS_CONFIG[application.status] ?? STATUS_CONFIG.pending;

  return (
    <div className="mx-auto mt-8 max-w-2xl">
      <div className={`border border-base-border bg-base-card ${config.glow}`}>
        {/* Betting slip header */}
        <div className="border-b border-base-border bg-base-dark px-6 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs tracking-widest text-text-muted">
              HACKLANTA // BET RECEIPT
            </span>
            <span className="font-mono text-xs text-gold">
              #{application.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="p-6">
          {/* Status badge */}
          <div className="mb-6 text-center">
            <span className="font-mono text-4xl">{config.icon}</span>
            <p className={`mt-2 font-mono text-2xl font-bold tracking-wider ${config.color}`}>
              {config.label}
            </p>
            <p className="mt-1 font-mono text-xs text-text-muted">
              // your application status
            </p>
          </div>

          {/* Application details */}
          <div className="space-y-3 border-t border-base-border pt-4">
            <DetailRow label="University" value={application.university} />
            <DetailRow label="Major" value={application.major} />
            <DetailRow label="Year" value={application.year_of_study} />
            {application.experience_level && (
              <DetailRow label="Experience" value={application.experience_level} />
            )}
            <DetailRow
              label="Submitted"
              value={new Date(application.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-base-border bg-base-dark px-6 py-3">
          <p className="text-center font-mono text-xs text-text-muted">
            &#9824; &#9830; &#9827; &#9829; &mdash; the house is reviewing your hand &mdash; &#9829; &#9827; &#9830; &#9824;
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between font-mono text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}
