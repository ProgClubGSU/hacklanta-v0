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
    glow: 'rgba(201, 168, 76, 0.15)',
    message: 'Your application is being reviewed. We\u2019ll update your status soon.',
  },
  accepted: {
    label: 'ACCEPTED',
    color: '#00ff88',
    glow: 'rgba(0, 255, 136, 0.15)',
    message: 'You\u2019re in. Check your email for next steps.',
  },
  rejected: {
    label: 'NOT SELECTED',
    color: '#E63946',
    glow: 'rgba(230, 57, 70, 0.15)',
    message: 'We couldn\u2019t offer you a spot this time. Thanks for your interest.',
  },
  waitlisted: {
    label: 'WAITLISTED',
    color: '#C9A84C',
    glow: 'rgba(201, 168, 76, 0.15)',
    message: 'You\u2019re on the waitlist. We\u2019ll reach out if a spot opens up.',
  },
} as const;

export default function ApplicationStatus() {
  const { getToken, isLoaded } = useAuth();
  const [state, setState] = useState<PageState>({ kind: 'loading' });

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
          setState(rid ? { kind: 'submitted' } : { kind: 'not_found' });
          return;
        }

        if (!res.ok) throw new Error(`Request failed (${res.status})`);

        const data: ApplicationData = await res.json();
        setState({ kind: 'submitted', data });
      } catch {
        setState(rid ? { kind: 'submitted' } : { kind: 'not_found' });
      }
    }

    fetchStatus();
  }, [isLoaded, getToken, rid]);

  if (state.kind === 'loading' || !isLoaded) {
    return (
      <div className="flex items-center justify-center py-32">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-transparent"
          style={{ borderTopColor: '#C41E3A' }}
        />
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div className="text-center">
        <p className="font-body text-sm text-white/40">{state.message}</p>
      </div>
    );
  }

  if (state.kind === 'not_found') {
    return (
      <div className="text-center">
        <h2 className="font-display text-3xl tracking-wide text-white/80 md:text-4xl">
          NO APPLICATION FOUND
        </h2>
        <p className="mx-auto mt-4 max-w-sm font-body text-sm leading-relaxed text-white/35">
          You haven't submitted an application yet.
        </p>
        <a
          href="/apply"
          className="mt-8 inline-flex items-center gap-3 bg-[#C41E3A] px-10 py-4 font-body text-sm font-bold tracking-[0.15em] text-white transition-all duration-300 hover:bg-[#E63946] hover:shadow-[0_0_50px_rgba(196,30,58,0.35)]"
        >
          APPLY NOW
        </a>
        <div className="mt-10">
          <a
            href="/"
            className="font-body text-xs tracking-widest text-white/20 uppercase transition-colors hover:text-white/40"
          >
            &larr; back to home
          </a>
        </div>
      </div>
    );
  }

  // Submitted state
  const data = state.data;
  const status = data?.status ?? 'pending';
  const config = STATUS_CONFIG[status];

  return (
    <div className="text-center">
      {/* Status label */}
      <div
        className="inline-block rounded-full px-5 py-2 font-body text-xs font-bold tracking-[0.2em]"
        style={{
          color: config.color,
          background: `color-mix(in srgb, ${config.color} 10%, transparent)`,
          border: `1px solid color-mix(in srgb, ${config.color} 20%, transparent)`,
          boxShadow: `0 0 40px ${config.glow}`,
        }}
      >
        {config.label}
      </div>

      {/* Main heading */}
      <h2 className="mt-8 font-display text-4xl tracking-wide text-white/90 md:text-5xl">
        APPLICATION SUBMITTED
      </h2>

      {/* Message */}
      <p className="mx-auto mt-5 max-w-md font-body text-base leading-relaxed text-white/35">
        {config.message}
      </p>

      {/* Divider */}
      <div className="mx-auto mt-10 h-px w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Details (only if we have backend data) */}
      {data && (
        <div className="mx-auto mt-8 flex max-w-sm flex-wrap justify-center gap-x-8 gap-y-4">
          <Detail label="University" value={data.university} />
          <Detail label="Major" value={data.major} />
          <Detail label="Year" value={data.year_of_study} />
          {data.experience_level && (
            <Detail label="Level" value={data.experience_level} />
          )}
        </div>
      )}

      {/* Back link */}
      <div className="mt-12">
        <a
          href="/"
          className="font-body text-xs tracking-widest text-white/20 uppercase transition-colors hover:text-white/40"
        >
          &larr; back to home
        </a>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="font-body text-[10px] tracking-[0.2em] text-white/25 uppercase">
        {label}
      </div>
      <div className="mt-1 font-body text-sm text-white/60">{value}</div>
    </div>
  );
}
