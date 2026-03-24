import { useState, useEffect } from 'react';
import ProfileCard from './ProfileCard.tsx';
import OnboardingCard from './OnboardingCard';
import ConfirmationBanner from './ConfirmationBanner';
import UserGrid from './UserGrid.tsx';
import TeamGrid from './TeamGrid.tsx';
import DashboardNav from './DashboardNav.tsx';
import LoadingHand from './casino/LoadingHand';
import { api } from '../../lib/api';

interface TabNavigationProps {
  page?: 'home' | 'teams';
  isConfirmed?: boolean;
}

export default function TabNavigation({ page = 'home', isConfirmed = false }: TabNavigationProps) {
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  useEffect(() => {
    checkProfile();
  }, []);

  async function checkProfile(retries = 1) {
    try {
      const profile = await api.getProfile();
      const complete = !!(profile?.display_name && profile?.linkedin_url && profile?.discord_username);
      setProfileComplete(complete);
    } catch {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 1000));
        return checkProfile(retries - 1);
      }
      setProfileComplete(false);
    } finally {
      setIsCheckingProfile(false);
    }
  }

  if (isCheckingProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingHand label="Shuffling the dashboard..." />
      </div>
    );
  }

  // Onboarding gate — profile incomplete
  if (profileComplete === false) {
    return (
      <div>
        <DashboardNav activePage={page} isConfirmed={isConfirmed} />
        <div className="mt-8">
          <OnboardingCard
            clerkFirstName={window.Clerk?.user?.firstName ?? null}
            clerkLastName={window.Clerk?.user?.lastName ?? null}
            clerkEmail={window.Clerk?.user?.primaryEmailAddress?.emailAddress ?? ''}
            onComplete={() => setProfileComplete(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <DashboardNav activePage={page} />

      {page === 'home' && (
        <>
          <ConfirmationBanner />

          {/* Hacker Guide / Prize Pool Banner */}
          <div className="relative overflow-hidden rounded-lg border-2 border-gold/30 bg-gradient-to-r from-gold/[0.08] to-transparent px-8 py-7">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold/10 blur-3xl" />
            <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gold" style={{ textShadow: '0 0 12px rgba(255,215,0,0.3)' }}>
                  $5,000+ Prize Pool
                </p>
                <h3 className="mt-2 font-display text-2xl uppercase tracking-[-0.02em] text-white sm:text-3xl">
                  Hacker Guide &amp; Tracks
                </h3>
                <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-white/60">
                  Everything you need to know — tracks, rules, prizes, schedule, and what to bring.
                </p>
              </div>
              <a
                href="https://miniature-door-703.notion.site/5-000-Hacklanta-2026-Hacker-Guide-31542ba1a9a080acbdd7d20f1fed873a?source=copy_link"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 rounded border-2 border-gold/50 bg-gold/20 px-7 py-3.5 font-mono text-sm font-bold uppercase tracking-[0.16em] text-white transition-all hover:border-gold/80 hover:bg-gold/30 hover:shadow-[0_0_30px_rgba(255,215,0,0.2)]"
                style={{ textShadow: '0 0 8px rgba(255,255,255,0.15)' }}
              >
                View Pre-Packet &rarr;
              </a>
            </div>
          </div>

          <ProfileCard />
          <section id="players">
            <UserGrid />
          </section>
        </>
      )}

      {page === 'teams' && (
        <section id="teams">
          <TeamGrid />
        </section>
      )}
    </div>
  );
}
