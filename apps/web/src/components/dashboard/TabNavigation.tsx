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
      const complete = !!(
        profile?.display_name &&
        profile?.linkedin_url &&
        profile?.discord_username
      );
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
      <DashboardNav activePage={page} isConfirmed={isConfirmed} />

      {page === 'home' && (
        <>
          <ConfirmationBanner />

          <div className="relative overflow-hidden rounded-lg border-2 border-gold/30 bg-gradient-to-r from-gold/[0.08] to-transparent px-8 py-7">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold/10 blur-3xl" />
            <div className="relative z-10 space-y-5">
              <div>
                <h3 className="font-display text-2xl uppercase tracking-[-0.02em] text-white sm:text-3xl">
                  Hacker Guide &amp; Tracks
                </h3>
                <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-white/60">
                  Everything you need to know - tracks, rules, prizes, schedule, and what to
                  bring.
                </p>
              </div>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-5">
                  <div>
                  <p
                    className="font-display text-4xl font-bold uppercase tracking-[-0.02em] text-gold sm:text-5xl"
                    style={{
                      textShadow:
                        '0 0 20px rgba(255,215,0,0.4), 0 0 40px rgba(255,215,0,0.2)',
                    }}
                  >
                    $5,000+
                  </p>
                  <p className="mt-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gold/70">
                    Prize Pool
                  </p>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                    <a
                      href="https://miniature-door-703.notion.site/5-000-Hacklanta-2026-Hacker-Guide-31542ba1a9a080acbdd7d20f1fed873a?source=copy_link"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-1 py-1 font-mono text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:text-gold"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 3.75h7.5L19.5 8.75v11.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15.5a1 1 0 0 1 1-1Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 3.75v5h5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6M9 16.5h6" />
                      </svg>
                      View Pre-Packet &rarr;
                    </a>
                    <a
                      href="https://discord.gg/5SnWkBq2"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-1 py-1 font-mono text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:text-[#5865F2]"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                      </svg>
                      Join Our Server
                    </a>
                  </div>
                </div>
              </div>
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
