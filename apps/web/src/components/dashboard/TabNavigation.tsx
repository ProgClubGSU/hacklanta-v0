import { useState, useEffect } from 'react';
import ProfileCard from './ProfileCard.tsx';
import OnboardingCard from './OnboardingCard';
import UserGrid from './UserGrid.tsx';
import TeamGrid from './TeamGrid.tsx';
import DashboardNav from './DashboardNav.tsx';
import { api } from '../../lib/api';

interface TabNavigationProps {
  page?: 'home' | 'teams';
}

export default function TabNavigation({ page = 'home' }: TabNavigationProps) {
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
        <DashboardNav activePage={page} />
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
