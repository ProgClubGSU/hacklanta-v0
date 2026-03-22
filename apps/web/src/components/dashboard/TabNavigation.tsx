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
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: 'space_dashboard' },
    { id: 'teams' as Tab, label: 'Teams', icon: 'groups' },
    { id: 'players' as Tab, label: 'Players', icon: 'person_search' },
  ];

  const isTabLocked = (tabId: Tab) => !profileComplete && (tabId === 'teams' || tabId === 'players');

  function handleTabClick(tabId: Tab) {
    if (isTabLocked(tabId)) return;
    setActiveTab(tabId);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] gap-0">
      {/* Sidebar — desktop only */}
      <aside className="hidden w-52 shrink-0 border-r border-white/6 pr-6 pt-2 md:block">
        <a href="/" className="mb-10 block" aria-label="Hacklanta home">
          <TextLogo size="xs" className="opacity-85" />
        </a>

        <nav className="space-y-1">
          {tabs.map((tab) => {
            const locked = isTabLocked(tab.id);
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-all duration-150 ${
                  locked
                    ? 'cursor-not-allowed opacity-25'
                    : active
                      ? 'bg-white/6 text-white'
                      : 'text-white/40 hover:bg-white/4 hover:text-white/70'
                }`}
                title={locked ? 'Complete your profile to unlock' : undefined}
              >
                <Icon name={locked ? 'lock' : tab.icon} className="text-[18px]" />
                <span className="font-mono text-[11px] uppercase tracking-[0.1em]">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-8 border-t border-white/6 pt-6">
          <a
            href="/"
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/25 transition-colors hover:text-white/50"
          >
            <Icon name="arrow_back" className="text-sm" />
            Home
          </a>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="fixed inset-x-0 top-0 z-30 border-b border-white/6 bg-[#141414]/95 backdrop-blur-md px-4 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <a href="/" aria-label="Hacklanta home">
            <TextLogo size="xs" className="opacity-85" />
          </a>
          <div className="flex items-center gap-5">
            {tabs.map((tab) => {
              const locked = isTabLocked(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                    locked
                      ? 'cursor-not-allowed opacity-25'
                      : activeTab === tab.id
                        ? 'text-red'
                        : 'text-white/40'
                  }`}
                >
                  {tab.label}
                  {locked && <Icon name="lock" className="ml-1 text-[10px]" weight={600} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="min-w-0 flex-1 pt-2 md:pl-6">
        {/* Mobile spacer for fixed nav */}
        <div className="h-10 md:hidden" />

        <div className="animate-fadeIn" key={activeTab}>
          {isCheckingProfile ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-red"></div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">Loading...</p>
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
      </main>

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
