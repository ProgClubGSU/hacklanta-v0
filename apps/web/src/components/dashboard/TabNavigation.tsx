import { useState, useEffect } from 'react';
import ProfileCard from './ProfileCard.tsx';
import OnboardingCard from './OnboardingCard';
import UserGrid from './UserGrid.tsx';
import TeamGrid from './TeamGrid.tsx';
import { TextLogo } from '../ui/TextLogoReact.tsx';
import Icon from '../ui/Icon';
import { api } from '../../lib/api';

type Tab = 'dashboard' | 'teams' | 'players';

export default function TabNavigation() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
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

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard' },
    { id: 'teams' as Tab, label: 'Teams' },
    { id: 'players' as Tab, label: 'Players' },
  ];

  const isTabLocked = (tabId: Tab) => !profileComplete && (tabId === 'teams' || tabId === 'players');

  function handleTabClick(tabId: Tab) {
    if (isTabLocked(tabId)) return;
    setActiveTab(tabId);
  }

  return (
    <div className="relative">
      {/* Flat nav bar */}
      <nav className="flex items-center justify-between gap-6 pb-4">
        <a href="/" className="shrink-0" aria-label="Hacklanta home">
          <TextLogo size="xs" className="opacity-85" />
        </a>

        <div className="flex items-center gap-6 sm:gap-8">
          {tabs.map((tab) => {
            const locked = isTabLocked(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`pb-1 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-200 ${
                  locked
                    ? 'cursor-not-allowed opacity-25'
                    : activeTab === tab.id
                      ? 'text-red'
                      : 'text-white/45 hover:text-white/75'
                }`}
                title={locked ? 'Complete your profile to unlock' : undefined}
              >
                <span className="flex items-center gap-1.5">
                  {tab.label}
                  {locked && <Icon name="lock" className="text-[12px]" weight={600} />}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Thin divider */}
      <div className="h-px bg-gradient-to-r from-red/30 via-red/10 to-transparent" />

      {/* Section number */}
      <div className="mt-6 mb-5 flex items-center gap-3 font-mono text-[11px] tracking-[0.3em] text-gray">
        <span className="text-red/80">[0{tabs.findIndex((tab) => tab.id === activeTab) + 1}]</span>
        <span className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="animate-fadeIn" key={activeTab}>
        {isCheckingProfile ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
              <p className="font-mono text-sm uppercase tracking-widest text-white/50">Loading...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              profileComplete === false ? (
                <OnboardingCard
                  clerkFirstName={window.Clerk?.user?.firstName ?? null}
                  clerkLastName={window.Clerk?.user?.lastName ?? null}
                  clerkEmail={window.Clerk?.user?.primaryEmailAddress?.emailAddress ?? ''}
                  onComplete={() => {
                    setProfileComplete(true);
                    setActiveTab('dashboard');
                  }}
                />
              ) : profileComplete === true ? (
                <ProfileCard
                  onBrowsePlayers={() => setActiveTab('players')}
                  onBrowseTeams={() => setActiveTab('teams')}
                />
              ) : null
            )}

            {activeTab === 'teams' && (
              profileComplete ? (
                <TeamGrid />
              ) : (
                <div className="relative">
                  <div className="pointer-events-none blur-md opacity-30 select-none">
                    <TeamGrid />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="font-mono text-sm uppercase tracking-wider text-white/60">
                      Complete your profile to unlock
                    </p>
                  </div>
                </div>
              )
            )}

            {activeTab === 'players' && (
              profileComplete ? (
                <UserGrid />
              ) : (
                <div className="relative">
                  <div className="pointer-events-none blur-md opacity-30 select-none">
                    <UserGrid />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="font-mono text-sm uppercase tracking-wider text-white/60">
                      Complete your profile to unlock
                    </p>
                  </div>
                </div>
              )
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
