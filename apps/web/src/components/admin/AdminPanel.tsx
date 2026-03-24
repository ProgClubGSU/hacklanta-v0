import { useState } from 'react';
import { TextLogo } from '../ui/TextLogoReact.tsx';
import ApplicantManager from './ApplicantManager';
import EmailBlastPanel from './EmailBlastPanel';
import StatsOverview from './StatsOverview';
import ResendSyncButton from './ResendSyncButton';

type Tab = 'applications' | 'email' | 'overview';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('applications');

  const tabs = [
    { id: 'applications' as Tab, label: 'Applications' },
    { id: 'email' as Tab, label: 'Email Blast' },
    { id: 'overview' as Tab, label: 'Overview' },
  ];

  return (
    <div className="relative">
      <div className="mb-8 overflow-hidden rounded-lg border border-primary/20 bg-[linear-gradient(135deg,#161313_0%,#191414_58%,#241414_100%)] shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
        <div className="flex items-center justify-between gap-6 px-4 py-3 sm:px-6">
          <div className="flex shrink-0 items-center gap-3">
            <a href="/" aria-label="Hacklanta home">
              <TextLogo size="xs" className="opacity-85" />
            </a>
            <span className="rounded border border-red/30 bg-red/10 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-red">
              Admin
            </span>
          </div>

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

        <div className="animate-fadeIn" key={activeTab}>
          {activeTab === 'applications' && <ApplicantManager />}
          {activeTab === 'email' && <EmailBlastPanel />}
          {activeTab === 'overview' && (
            <>
              <StatsOverview />
              <div className="mt-8">
                <ResendSyncButton />
              </div>
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
