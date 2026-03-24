import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { OPEN_EDITOR_FOR_CONFIRM_EVENT, PROFILE_SAVED_FOR_CONFIRM_EVENT } from '@/lib/dashboard-events';

type AppStatus = 'accepted' | 'accepted_overflow' | 'confirmed' | 'confirmed_overflow' | null;

export default function ConfirmationBanner() {
  const [status, setStatus] = useState<AppStatus>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();

    // Listen for profile-saved-for-confirm event — auto-trigger confirmation
    const handleProfileSaved = () => {
      doConfirm();
    };
    window.addEventListener(PROFILE_SAVED_FOR_CONFIRM_EVENT, handleProfileSaved);
    return () => {
      window.removeEventListener(PROFILE_SAVED_FOR_CONFIRM_EVENT, handleProfileSaved);
    };
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch('/api/applications/me', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (['accepted', 'accepted_overflow', 'confirmed', 'confirmed_overflow'].includes(data.status)) {
        setStatus(data.status);
      }
    } catch {
      // silently fail — banner just won't show
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setError(null);

    // Check profile completeness client-side first
    const profile = await api.getProfile();
    const missing: string[] = [];
    if (!profile?.display_name?.trim()) missing.push('display_name');
    if (!profile?.bio?.trim()) missing.push('bio');
    if (!profile?.linkedin_url?.trim()) missing.push('linkedin_url');
    if (!profile?.discord_username?.trim()) missing.push('discord_username');

    if (missing.length > 0) {
      // Open profile editor in confirm mode
      window.dispatchEvent(new CustomEvent(OPEN_EDITOR_FOR_CONFIRM_EVENT));
      return;
    }

    await doConfirm();
  }

  async function doConfirm() {
    setIsConfirming(true);
    setError(null);

    try {
      const result = await api.confirmAttendance();

      if (result.missing && result.missing.length > 0) {
        window.dispatchEvent(new CustomEvent(OPEN_EDITOR_FOR_CONFIRM_EVENT));
        setIsConfirming(false);
        return;
      }

      if (result.result === 'waitlisted') {
        setError('All spots have been filled. You\'ve been added to the waitlist.');
        setStatus(null);
      } else if (result.result === 'confirmed' || result.result === 'confirmed_overflow' || result.result === 'already_confirmed') {
        setStatus(result.result === 'confirmed_overflow' ? 'confirmed_overflow' : 'confirmed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm. Try again.');
    } finally {
      setIsConfirming(false);
    }
  }

  if (loading || !status) return null;

  const isConfirmed = status === 'confirmed' || status === 'confirmed_overflow';
  const isOverflow = status === 'accepted_overflow' || status === 'confirmed_overflow';

  return (
    <div
      className={`relative overflow-hidden rounded-lg border-2 ${
        isConfirmed
          ? 'border-[#00ff88]/30 bg-[#00ff88]/[0.06] px-6 py-5'
          : 'border-[#C41E3A]/40 bg-[#C41E3A]/[0.08] px-8 py-8'
      }`}
    >
      {/* Glow effect */}
      <div
        className={`pointer-events-none absolute -right-20 -top-20 rounded-full blur-3xl ${
          isConfirmed ? 'h-40 w-40 bg-[#00ff88]/10' : 'h-60 w-60 bg-[#C41E3A]/15'
        }`}
      />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {isConfirmed ? (
            <>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_rgba(0,255,136,0.5)]" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#00ff88]">
                  Confirmed
                </span>
              </div>
              <p className="mt-2 font-body text-sm text-white/60">
                {isOverflow
                  ? "You're confirmed as an overflow admit. Full event access, but food and swag are not guaranteed."
                  : "You're confirmed. See you at Hacklanta."}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 animate-pulse rounded-full bg-[#C41E3A] shadow-[0_0_12px_rgba(196,30,58,0.6)]" />
                <span className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-[#C41E3A]" style={{ textShadow: '0 0 15px rgba(196,30,58,0.4)' }}>
                  Action Required
                </span>
              </div>
              <h3 className="mt-3 font-display text-2xl uppercase tracking-[-0.02em] text-white sm:text-3xl">
                Confirm your attendance
              </h3>
              <p className="mt-2 max-w-lg font-body text-sm leading-relaxed text-white/70">
                {isOverflow
                  ? "You're an overflow admit \u2014 full access to the hackathon, but food and swag are not guaranteed. Confirm now to lock in your spot."
                  : "Your spot is reserved but not locked in yet. Confirm now so we know you're coming."}
              </p>
            </>
          )}
        </div>

        {!isConfirmed && (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirming}
            className="shrink-0 rounded border-2 border-[#C41E3A]/60 bg-[#C41E3A]/25 px-8 py-4 font-mono text-sm font-bold uppercase tracking-[0.18em] text-white transition-all hover:border-[#C41E3A] hover:bg-[#C41E3A]/40 hover:shadow-[0_0_40px_rgba(196,30,58,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ textShadow: '0 0 10px rgba(255,255,255,0.2)' }}
          >
            {isConfirming ? 'Confirming...' : 'Confirm My Spot'}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded border border-red-bright/30 bg-red-bright/10 px-4 py-2.5 font-body text-xs text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
