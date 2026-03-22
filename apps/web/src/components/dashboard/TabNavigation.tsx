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
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null); // null = loading
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
      <div className="mb-8 overflow-hidden rounded-lg border border-primary/20 bg-[linear-gradient(135deg,#161313_0%,#191414_58%,#241414_100%)] shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between gap-6 px-4 py-3 sm:px-6">
          <a href="/" className="shrink-0" aria-label="Hacklanta home">
            <TextLogo size="xs" className="opacity-85" />
          </a>

          <div className="flex flex-1 justify-end overflow-x-auto">
            <div className="flex min-w-max items-center gap-6 sm:gap-8">
              {tabs.map((tab) => {
                const locked = isTabLocked(tab.id);
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`border-b-2 pb-1 font-body text-[12px] font-bold uppercase tracking-[0.04em] transition-colors duration-200 ${
                      locked
                        ? 'cursor-not-allowed border-transparent opacity-30'
                        : activeTab === tab.id
                          ? 'border-red text-red'
                          : 'border-transparent text-white/55 hover:text-white/85'
                    }`}
                    title={locked ? 'Complete your profile to unlock' : undefined}
                  >
                    <span className="flex items-center gap-1.5">
                      {tab.label}
                      {locked && <Icon name="lock" className="text-[14px]" weight={600} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-b border-primary/20">
        <div className="pointer-events-none absolute inset-0 -top-24 bg-[radial-gradient(circle_at_50%_0%,rgba(196,30,58,0.08)_0%,transparent_60%)]" />
      </div>

      <div className="relative mt-8">
        <div className="mb-6 flex items-center gap-3 font-mono text-[11px] tracking-[0.3em] text-gray">
          <span className="text-red/80">[0{tabs.findIndex((tab) => tab.id === activeTab) + 1}]</span>
          <span className="h-px flex-1 bg-gradient-to-r from-border/80 to-transparent" />
        </div>

        <div className="animate-fadeIn">
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
                      <div className="text-center">
                        <p className="font-mono text-sm uppercase tracking-wider text-white/60">
                          Complete your profile to unlock
                        </p>
                      </div>
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
                      <div className="text-center">
                        <p className="font-mono text-sm uppercase tracking-wider text-white/60">
                          Complete your profile to unlock
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </>
          )}
        </div>
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
