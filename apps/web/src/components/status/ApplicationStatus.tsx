import { useAuth } from '@clerk/astro/react';
import { useEffect, useState } from 'react';

interface ApplicationData {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'waitlisted';
  university: string;
  major: string;
  year_of_study: string;
  experience_level: string | null;
  created_at: string;
  reviewed_at: string | null;
}

const STATUS_CONFIG = {
  pending: {
    label: 'UNDER REVIEW',
    color: '#C9A84C',
    glow: 'rgba(201, 168, 76, 0.15)',
    suit: '\u2666',
    icon: '\u23F3',
  },
  accepted: {
    label: 'ACCEPTED',
    color: '#00ff88',
    glow: 'rgba(0, 255, 136, 0.15)',
    suit: '\u2665',
    icon: '\u2713',
  },
  rejected: {
    label: 'NOT SELECTED',
    color: '#E63946',
    glow: 'rgba(230, 57, 70, 0.15)',
    suit: '\u2660',
    icon: '\u2717',
  },
  waitlisted: {
    label: 'WAITLISTED',
    color: '#C9A84C',
    glow: 'rgba(201, 168, 76, 0.15)',
    suit: '\u2666',
    icon: '\u23F3',
  },
} as const;

export default function ApplicationStatus() {
  const { getToken, isLoaded } = useAuth();
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    async function fetchStatus() {
      try {
        const token = await getToken();
        const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v1/applications/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }

        const data: ApplicationData = await res.json();
        setApplication(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, [isLoaded, getToken]);

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-mono text-xs tracking-[0.3em] text-white/40 uppercase">
          // loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div
          className="rounded-sm border px-6 py-8"
          style={{
            borderColor: 'rgba(230, 57, 70, 0.3)',
            background: 'rgba(230, 57, 70, 0.05)',
          }}
        >
          <div className="mb-2 font-mono text-xs tracking-[0.3em] text-[#E63946] uppercase">
            // error
          </div>
          <p className="text-sm text-white/60">{error}</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div
          className="rounded-sm border px-6 py-10"
          style={{
            borderColor: 'rgba(196, 30, 58, 0.15)',
            background: 'rgba(196, 30, 58, 0.03)',
          }}
        >
          <div className="mb-3 text-3xl text-white/20">{'\u2660'}</div>
          <div className="mb-2 font-mono text-xs tracking-[0.3em] text-white/40 uppercase">
            // no application found
          </div>
          <p className="mb-6 text-sm text-white/50">
            You haven't submitted an application yet.
          </p>
          <a
            href="/apply"
            className="inline-flex items-center gap-2 border px-6 py-2 font-mono text-[11px] font-semibold tracking-[0.15em] uppercase transition-all duration-300"
            style={{
              borderColor: 'rgba(196, 30, 58, 0.4)',
              background: 'rgba(196, 30, 58, 0.1)',
              color: '#E63946',
            }}
          >
            $ ante up
          </a>
        </div>
      </div>
    );
  }

  if (!application) return null;

  const config = STATUS_CONFIG[application.status];
  const submittedDate = new Date(application.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const reviewedDate = application.reviewed_at
    ? new Date(application.reviewed_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="mx-auto max-w-md">
      {/* Betting slip card */}
      <div
        className="relative overflow-hidden rounded-sm border"
        style={{
          borderColor: `color-mix(in srgb, ${config.color} 25%, transparent)`,
          background: '#0d0507',
          boxShadow: `0 0 60px ${config.glow}, 0 20px 60px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Top accent bar */}
        <div className="h-[2px]" style={{ background: config.color }} />

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="mb-1 flex items-center justify-between">
            <span
              className="font-mono text-[10px] tracking-[0.3em] uppercase"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              // application slip
            </span>
            <span style={{ color: config.color, fontSize: '18px' }}>
              {config.suit}
            </span>
          </div>

          {/* Status badge */}
          <div className="mt-4 flex items-center gap-3">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-sm text-sm"
              style={{
                background: `color-mix(in srgb, ${config.color} 15%, transparent)`,
                color: config.color,
                border: `1px solid color-mix(in srgb, ${config.color} 30%, transparent)`,
              }}
            >
              {config.icon}
            </span>
            <div>
              <div
                className="font-mono text-sm font-bold tracking-[0.15em]"
                style={{ color: config.color }}
              >
                {config.label}
              </div>
              <div className="font-mono text-[10px] text-white/30">
                Submitted {submittedDate}
              </div>
            </div>
          </div>
        </div>

        {/* Perforated divider */}
        <div className="relative my-1 flex items-center px-3">
          <div className="h-3 w-3 rounded-full" style={{ background: '#1a0a0e', marginLeft: '-18px' }} />
          <div
            className="flex-1 border-t"
            style={{ borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.08)' }}
          />
          <div className="h-3 w-3 rounded-full" style={{ background: '#1a0a0e', marginRight: '-18px' }} />
        </div>

        {/* Details */}
        <div className="space-y-3 px-6 pt-4 pb-6">
          <DetailRow label="University" value={application.university} />
          <DetailRow label="Major" value={application.major} />
          <DetailRow label="Year" value={application.year_of_study} />
          {application.experience_level && (
            <DetailRow label="Level" value={application.experience_level} />
          )}
          {reviewedDate && <DetailRow label="Reviewed" value={reviewedDate} />}
        </div>

        {/* Footer suits */}
        <div
          className="flex items-center justify-center gap-4 py-3 font-mono text-[10px]"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.15)',
          }}
        >
          <span>{'\u2660'}</span>
          <span>{'\u2665'}</span>
          <span>{'\u2666'}</span>
          <span>{'\u2663'}</span>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] tracking-[0.2em] text-white/30 uppercase">
        {label}
      </span>
      <span className="text-right font-mono text-xs text-white/70">{value}</span>
    </div>
  );
}
