import { TextLogo } from '../ui/TextLogoReact.tsx';

interface DashboardNavProps {
  activePage: 'home' | 'teams';
}

const NAV_ITEMS = [
  { id: 'home' as const, label: 'Dashboard', href: '/dashboard/team' },
  { id: 'teams' as const, label: 'Teams', href: '/dashboard/teams' },
];

export default function DashboardNav({ activePage }: DashboardNavProps) {
  return (
    <header className="flex items-center justify-between border-b border-white/8 pb-4">
      <div className="flex items-center gap-8">
        <a href="/" aria-label="Hacklanta home">
          <TextLogo size="xs" className="opacity-85" />
        </a>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.id === activePage;
            return (
              <a
                key={item.id}
                href={item.href}
                className={`rounded px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                  isActive
                    ? 'bg-white/10 font-semibold text-white'
                    : 'text-white/40 hover:bg-white/5 hover:text-white/70'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>

      <a
        href="/"
        className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/25 transition-colors hover:text-white/50"
      >
        &larr; Home
      </a>
    </header>
  );
}
