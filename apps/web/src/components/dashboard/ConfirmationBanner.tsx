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
      className={`relative overflow-hidden rounded-lg border px-6 py-5 ${
        isConfirmed
          ? 'border-[#00ff88]/30 bg-[#00ff88]/[0.06]'
          : 'border-[#C41E3A]/30 bg-[#C41E3A]/[0.06]'
      }`}
    >
      {/* Glow effect */}
      <div
        className={`pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full blur-3xl ${
          isConfirmed ? 'bg-[#00ff88]/10' : 'bg-[#C41E3A]/10'
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
                <div className="h-2 w-2 animate-pulse rounded-full bg-[#C41E3A] shadow-[0_0_8px_rgba(196,30,58,0.5)]" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#C41E3A]">
                  Action Required
                </span>
              </div>
              <p className="mt-2 font-body text-sm text-white/60">
                {isOverflow
                  ? "You're an overflow admit \u2014 full access to the hackathon, but food and swag are not guaranteed. Confirm to lock in your spot."
                  : 'Your spot is reserved. Confirm your attendance to lock it in.'}
              </p>
            </>
          )}
        </div>

        {!isConfirmed && (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirming}
            className="shrink-0 rounded border border-[#C41E3A]/50 bg-[#C41E3A]/20 px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-all hover:border-[#C41E3A]/80 hover:bg-[#C41E3A]/30 hover:shadow-[0_0_30px_rgba(196,30,58,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
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
