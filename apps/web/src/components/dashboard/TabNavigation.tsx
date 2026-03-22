import { useState, useEffect } from 'react';
import ProfileCard from './ProfileCard.tsx';
import OnboardingCard from './OnboardingCard';
import UserGrid from './UserGrid.tsx';
import TeamGrid from './TeamGrid.tsx';
import { TextLogo } from '../ui/TextLogoReact.tsx';
import { api } from '../../lib/api';

export default function TabNavigation() {
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  useEffect(() => {
    checkProfile();
  }, []);

  async function checkProfile() {
    try {
      const profile = await api.getProfile();
      const complete = !!(profile?.display_name && profile?.linkedin_url && profile?.discord_username);
      setProfileComplete(complete);
    } catch {
      setProfileComplete(false);
    } finally {
      setIsCheckingProfile(false);
    }
  }

  if (isCheckingProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-red"></div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">Loading...</p>
        </div>
      </div>
    );
  }

  // Onboarding gate — profile incomplete
  if (profileComplete === false) {
    return (
      <div>
        <header className="mb-8 flex items-center justify-between">
          <a href="/" aria-label="Hacklanta home">
            <TextLogo size="xs" className="opacity-85" />
          </a>
          <a href="/" className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/25 transition-colors hover:text-white/50">
            &larr; Home
          </a>
        </header>
        <OnboardingCard
          clerkFirstName={window.Clerk?.user?.firstName ?? null}
          clerkLastName={window.Clerk?.user?.lastName ?? null}
          clerkEmail={window.Clerk?.user?.primaryEmailAddress?.emailAddress ?? ''}
          onComplete={() => setProfileComplete(true)}
        />
      </div>
    );
  }

  // Full dashboard — single scrollable page
  return (
    <div className="space-y-12">
      {/* Top bar */}
      <header id="top" className="flex items-center justify-between">
        <a href="/" aria-label="Hacklanta home">
          <TextLogo size="xs" className="opacity-85" />
        </a>
        <a href="/" className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/25 transition-colors hover:text-white/50">
          &larr; Home
        </a>
      </header>

      {/* Profile */}
      <ProfileCard />

      {/* Teams */}
      <section id="teams">
        <TeamGrid />
      </section>

      {/* Players */}
      <section id="players">
        <UserGrid />
      </section>

      {/* Back to top */}
      <div className="flex justify-center pb-4">
        <a
          href="#top"
          className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/20 transition-colors hover:text-white/50"
        >
          &uarr; Back to profile
        </a>
      </div>
    </div>
  );
}
