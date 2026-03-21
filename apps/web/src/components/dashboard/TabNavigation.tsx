import { useState } from 'react';
import ProfileCard from './ProfileCard';
import TeamManager from './TeamManager';
import UserGrid from './UserGrid';
import TeamGrid from './TeamGrid';

type Tab = 'profile' | 'team' | 'teammates' | 'teams';

export default function TabNavigation() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const tabs = [
    { id: 'profile' as Tab, label: 'My Profile', icon: '👤' },
    { id: 'team' as Tab, label: 'My Team', icon: '🤝' },
    { id: 'teammates' as Tab, label: 'Find Teammates', icon: '👨‍💻' },
    { id: 'teams' as Tab, label: 'Find Teams', icon: '⚡' },
  ];

  return (
    <div className="relative">
      {/* Tab Navigation */}
      <div className="relative border-b border-red/30">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 -top-24 bg-[radial-gradient(circle_at_50%_0%,rgba(196,30,58,0.08)_0%,transparent_60%)]" />

        {/* Tabs container */}
        <nav className="relative z-10 flex gap-0 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                group relative flex-shrink-0 px-6 py-4
                font-mono text-[11px] font-semibold uppercase tracking-[0.25em]
                transition-all duration-300
                border-b-2
                ${
                  activeTab === tab.id
                    ? 'border-red text-red-bright shadow-[0_4px_12px_rgba(196,30,58,0.3)]'
                    : 'border-transparent text-gray hover:text-white/80'
                }
              `}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </span>

              {/* Hover glow */}
              {activeTab !== tab.id && (
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-red/30 to-transparent" />
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Card suit decorations */}
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 select-none text-2xl text-red/10" aria-hidden="true">
          ♠
        </div>
      </div>

      {/* Tab Panels */}
      <div className="relative mt-8">
        {/* Section number indicator */}
        <div className="mb-6 flex items-center gap-3 font-mono text-[11px] tracking-[0.3em] text-gray">
          <span className="text-red/80">
            [0{tabs.findIndex(t => t.id === activeTab) + 1}]
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-border/80 to-transparent" />
        </div>

        {/* Content */}
        <div className="animate-fadeIn">
          {activeTab === 'profile' && <ProfileCard />}
          {activeTab === 'team' && <TeamManager />}
          {activeTab === 'teammates' && <UserGrid />}
          {activeTab === 'teams' && <TeamGrid />}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
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
