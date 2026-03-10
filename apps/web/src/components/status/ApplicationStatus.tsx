import { useAuth } from '@clerk/astro/react';
import { useEffect, useRef, useState } from 'react';

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
    <div className="relative h-screen overflow-hidden bg-[#1a0a0e]">
      {/* Background: Banner — fills top half */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 opacity-40">
        <img
          src="/images/posters/banner.png"
          alt=""
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a0e]/30 via-transparent to-[#1a0a0e]" />
      </div>

      {/* Background: Poster Marquee — fills bottom half */}
      <PosterMarquee />

      {/* Content — centered in viewport */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
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

        <h2 className="mt-5 font-display text-5xl tracking-wide text-white/90 md:text-7xl">
          UR IN THE QUEUE
        </h2>

        <p className="mx-auto mt-3 max-w-xs font-body text-sm leading-relaxed text-white/40">
          {config.message}
        </p>

        {/* Social CTAs */}
        <div className="mt-8 flex items-center gap-3">
          <a
            href="https://discord.com/invite/BgKg9gskM2"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border border-[#5865F2]/30 bg-[#5865F2]/10 px-7 py-3.5 font-body text-sm font-bold tracking-[0.15em] text-white transition-all duration-300 hover:border-[#5865F2]/60 hover:bg-[#5865F2]/20 hover:shadow-[0_0_40px_rgba(88,101,242,0.3)]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#5865F2]" aria-hidden="true">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            DISCORD
          </a>
          <a
            href="https://www.instagram.com/progsuhq/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border border-[#E1306C]/30 bg-[#E1306C]/10 px-7 py-3.5 font-body text-sm font-bold tracking-[0.15em] text-white transition-all duration-300 hover:border-[#E1306C]/60 hover:bg-[#E1306C]/20 hover:shadow-[0_0_40px_rgba(225,48,108,0.3)]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#E1306C]" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
            </svg>
            INSTAGRAM
          </a>
        </div>

        <a
          href="/"
          className="mt-6 font-body text-xs tracking-widest text-white/20 uppercase transition-colors hover:text-white/40"
        >
          &larr; home
        </a>
      </div>
    </div>
  );
}

const POSTERS = [
  '/images/posters/poster-1.png',
  '/images/posters/poster-2.png',
  '/images/posters/poster-3.png',
  '/images/posters/poster-4.png',
  '/images/posters/poster-5.png',
];

function PosterMarquee() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [setWidth, setSetWidth] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Wait for images to load, then measure one set's width
    const images = track.querySelectorAll('img');
    let loaded = 0;
    const total = images.length;

    function measure() {
      // Width of one poster set = total scrolling width / 3
      setSetWidth(track!.scrollWidth / 3);
    }

    images.forEach((img) => {
      if (img.complete) {
        loaded++;
      } else {
        img.addEventListener('load', () => {
          loaded++;
          if (loaded >= total) measure();
        }, { once: true });
      }
    });

    if (loaded >= total) measure();

    // Re-measure on resize
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 overflow-hidden opacity-35">
      <div className="absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-[#1a0a0e] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-[#1a0a0e] to-transparent" />
      <div className="absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#1a0a0e] to-transparent" />
      <div className="absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#1a0a0e] to-transparent" />
      <div
        ref={trackRef}
        className="flex h-full items-end"
        style={setWidth ? {
          animation: `marquee-exact 35s linear infinite`,
        } : undefined}
      >
        {/* 3 copies for seamless loop */}
        {[...POSTERS, ...POSTERS, ...POSTERS].map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className="h-full w-auto flex-shrink-0 object-cover"
            loading="lazy"
          />
        ))}
      </div>
      {setWidth > 0 && (
        <style>{`
          @keyframes marquee-exact {
            0% { transform: translateX(0); }
            100% { transform: translateX(-${setWidth}px); }
          }
        `}</style>
      )}
    </div>
  );
}

