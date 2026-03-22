import { useState } from 'react';
import ProfileCard from './ProfileCard.tsx';
import UserGrid from './UserGrid.tsx';
import TeamGrid from './TeamGrid.tsx';

type Tab = 'dashboard' | 'teams' | 'players';

export default function TabNavigation() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard' },
    { id: 'teams' as Tab, label: 'Teams' },
    { id: 'players' as Tab, label: 'Players' },
  ];

  return (
    <div className="relative">
      <div className="mb-8 overflow-hidden rounded-lg border border-primary/20 bg-[linear-gradient(135deg,#161313_0%,#191414_58%,#241414_100%)] shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between gap-6 px-4 py-3 sm:px-6">
          <a href="/" className="shrink-0 transition-opacity hover:opacity-85" aria-label="Hacklanta home">
            <img
              src="/logo_trimmed.png"
              alt="Hacklanta"
              className="h-6 w-auto object-contain sm:h-7"
            />
          </a>

          <div className="flex flex-1 justify-end overflow-x-auto">
            <div className="flex min-w-max items-center gap-6 sm:gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`border-b-2 pb-1 font-body text-[12px] font-bold uppercase tracking-[0.04em] transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-red text-red'
                      : 'border-transparent text-white/55 hover:text-white/85'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
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
          {activeTab === 'dashboard' && (
            <ProfileCard
              onBrowsePlayers={() => setActiveTab('players')}
              onBrowseTeams={() => setActiveTab('teams')}
            />
          )}
          {activeTab === 'teams' && <TeamGrid />}
          {activeTab === 'players' && <UserGrid />}
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
