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

type PageState =
  | { kind: 'loading' }
  | { kind: 'submitted'; data?: ApplicationData }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string };

const STATUS_CONFIG = {
  pending: {
    label: 'UNDER REVIEW',
    color: '#C9A84C',
    glow: 'rgba(201, 168, 76, 0.12)',
    suit: '\u2666',
    icon: '\u23F3',
    message: 'Your application is being reviewed by the Hacklanta team. Sit tight \u2014 we\u2019ll update your status soon.',
  },
  accepted: {
    label: 'ACCEPTED',
    color: '#00ff88',
    glow: 'rgba(0, 255, 136, 0.12)',
    suit: '\u2665',
    icon: '\u2713',
    message: 'You\u2019re in. Welcome to the table. Check your email for next steps.',
  },
  rejected: {
    label: 'NOT SELECTED',
    color: '#E63946',
    glow: 'rgba(230, 57, 70, 0.12)',
    suit: '\u2660',
    icon: '\u2717',
    message: 'Unfortunately we couldn\u2019t offer you a spot this time. We appreciate your interest.',
  },
  waitlisted: {
    label: 'WAITLISTED',
    color: '#C9A84C',
    glow: 'rgba(201, 168, 76, 0.12)',
    suit: '\u2666',
    icon: '\u23F3',
    message: 'You\u2019re on the waitlist. We\u2019ll reach out if a spot opens up.',
  },
} as const;

export default function ApplicationStatus() {
  const { getToken, isLoaded } = useAuth();
  const [state, setState] = useState<PageState>({ kind: 'loading' });

  // Check for Tally respondent ID in URL
  const rid = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('rid')
    : null;

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
          // No application in backend — fall back to rid check
          if (rid) {
            setState({ kind: 'submitted' });
          } else {
            setState({ kind: 'not_found' });
          }
          return;
        }

        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }

        const data: ApplicationData = await res.json();
        setState({ kind: 'submitted', data });
      } catch {
        // Backend unreachable — fall back to rid check
        if (rid) {
          setState({ kind: 'submitted' });
        } else {
          setState({ kind: 'not_found' });
        }
      }
    }

    fetchStatus();
  }, [isLoaded, getToken, rid]);

  if (state.kind === 'loading' || !isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-mono text-xs tracking-[0.3em] text-white/40 uppercase animate-pulse">
          // dealing cards...
        </div>
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div className="mx-auto max-w-md text-center">
        <div
          className="border px-6 py-8"
          style={{
            borderColor: 'rgba(230, 57, 70, 0.2)',
            background: 'rgba(230, 57, 70, 0.03)',
          }}
        >
          <div className="mb-3 text-2xl" style={{ color: 'rgba(230, 57, 70, 0.4)' }}>
            {'\u2660'}
          </div>
          <div className="mb-2 font-mono text-[10px] tracking-[0.3em] text-[#E63946]/60 uppercase">
            // error
          </div>
          <p className="text-sm text-white/50">{state.message}</p>
        </div>
      </div>
    );
  }

  if (state.kind === 'not_found') {
    return (
      <div className="mx-auto max-w-md text-center">
        <div
          className="border px-6 py-12"
          style={{
            borderColor: 'rgba(196, 30, 58, 0.12)',
            background: 'linear-gradient(180deg, rgba(196,30,58,0.03) 0%, rgba(10,4,6,0.5) 100%)',
          }}
        >
          <div className="mb-4 text-4xl" style={{ color: 'rgba(196, 30, 58, 0.15)' }}>
            {'\u2660'}
          </div>
          <div className="mb-2 font-mono text-[10px] tracking-[0.3em] text-white/30 uppercase">
            // no application found
          </div>
          <p className="mb-8 text-sm leading-relaxed text-white/40">
            You haven't submitted an application yet.
          </p>
          <a
            href="/apply"
            className="group relative inline-flex items-center gap-2 overflow-hidden border px-8 py-3 font-body text-[11px] font-semibold tracking-[0.15em] uppercase transition-all duration-500"
            style={{
              borderColor: 'rgba(196, 30, 58, 0.35)',
              background: 'rgba(196, 30, 58, 0.08)',
              color: '#E63946',
            }}
          >
            <span className="relative z-10">$ ante up</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[rgba(196,30,58,0.08)] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
          </a>
        </div>
      </div>
    );
  }

  // state.kind === 'submitted'
  const data = state.data;
  const status = data?.status ?? 'pending';
  const config = STATUS_CONFIG[status];

  const submittedDate = data?.created_at
    ? new Date(data.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  const reviewedDate = data?.reviewed_at
    ? new Date(data.reviewed_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="mx-auto max-w-md">
      {/* Betting slip card */}
      <div
        className="relative overflow-hidden border"
        style={{
          borderColor: `color-mix(in srgb, ${config.color} 20%, transparent)`,
          background: 'linear-gradient(180deg, #0d0507 0%, #080304 100%)',
          boxShadow: `0 0 80px ${config.glow}, 0 25px 60px rgba(0,0,0,0.6)`,
        }}
      >
        {/* Top accent bar */}
        <div
          className="h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
          }}
        />

        {/* Header */}
        <div className="px-6 pt-6 pb-5">
          <div className="mb-1 flex items-center justify-between">
            <span
              className="font-mono text-[10px] tracking-[0.3em] uppercase"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              // application slip
            </span>
            <span style={{ color: config.color, fontSize: '20px', opacity: 0.6 }}>
              {config.suit}
            </span>
          </div>

          {/* Status badge */}
          <div className="mt-5 flex items-center gap-4">
            <span
              className="flex h-10 w-10 items-center justify-center text-lg"
              style={{
                background: `color-mix(in srgb, ${config.color} 12%, transparent)`,
                color: config.color,
                border: `1px solid color-mix(in srgb, ${config.color} 25%, transparent)`,
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
              <div className="mt-0.5 font-mono text-[10px] text-white/25">
                Submitted {submittedDate}
              </div>
            </div>
          </div>

          {/* Status message */}
          <p className="mt-4 text-sm leading-relaxed text-white/40">
            {config.message}
          </p>
        </div>

        {/* Perforated divider */}
        <div className="relative flex items-center px-3">
          <div
            className="h-4 w-4 rounded-full"
            style={{ background: '#080304', marginLeft: '-22px', boxShadow: '2px 0 8px rgba(0,0,0,0.5)' }}
          />
          <div
            className="flex-1 border-t"
            style={{ borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.06)' }}
          />
          <div
            className="h-4 w-4 rounded-full"
            style={{ background: '#080304', marginRight: '-22px', boxShadow: '-2px 0 8px rgba(0,0,0,0.5)' }}
          />
        </div>

        {/* Details */}
        <div className="space-y-3 px-6 pt-5 pb-6">
          {data ? (
            <>
              <DetailRow label="University" value={data.university} />
              <DetailRow label="Major" value={data.major} />
              <DetailRow label="Year" value={data.year_of_study} />
              {data.experience_level && (
                <DetailRow label="Level" value={data.experience_level} />
              )}
              {reviewedDate && <DetailRow label="Reviewed" value={reviewedDate} />}
            </>
          ) : (
            <>
              <DetailRow label="Status" value="Pending Review" />
              <DetailRow label="Reference" value={rid ? `#${rid.slice(0, 8).toUpperCase()}` : '---'} />
            </>
          )}
        </div>

        {/* Footer suits */}
        <div
          className="flex items-center justify-center gap-6 py-3 font-mono text-[10px]"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.1)',
          }}
        >
          <span>{'\u2660'}</span>
          <span>{'\u2665'}</span>
          <span>{'\u2666'}</span>
          <span>{'\u2663'}</span>
        </div>
      </div>

      {/* Back to home link */}
      <div className="mt-8 text-center">
        <a
          href="/"
          className="font-mono text-[10px] tracking-[0.2em] text-white/20 uppercase transition-colors duration-300 hover:text-white/40"
        >
          &larr; back to table
        </a>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] tracking-[0.2em] text-white/25 uppercase">
        {label}
      </span>
      <span className="text-right font-mono text-xs text-white/60">{value}</span>
    </div>
  );
}
