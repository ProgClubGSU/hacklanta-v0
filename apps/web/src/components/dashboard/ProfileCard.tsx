import { useAuth } from '@clerk/astro/react';
import { useState } from 'react';
import Icon from '@/components/ui/Icon';

interface ProfileCardProps {
  onBrowsePlayers?: () => void;
  onBrowseTeams?: () => void;
}

interface ProfileData {
  headline: string;
  bio: string;
  linkedin: string;
  github: string;
  portfolio: string;
  resume: string;
}

export default function ProfileCard({ onBrowsePlayers, onBrowseTeams }: ProfileCardProps) {
  const { isLoaded, userId } = useAuth();
  const displayUserId = userId?.slice(-2) || '00';
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    headline: 'Product Builder + Full-Stack Hacker',
    bio: 'I build polished product experiences with React, TypeScript, Python, and AI tooling. I like working on fast-moving teams, shaping product direction early, and turning vague ideas into clean demos people actually want to use.',
    linkedin: 'linkedin.com/in/player-04',
    github: 'github.com/player-04',
    portfolio: 'player04.dev',
    resume: 'player04.dev/resume',
  });
  const [draft, setDraft] = useState<ProfileData>(profile);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
          <p className="font-mono text-sm uppercase tracking-widest text-white/50">Loading profile...</p>
        </div>
      </div>
    );
  }

  const teammates = [
    { id: '1', name: 'Alex Chen', role: 'Frontend', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
    { id: '2', name: 'Sarah Johnson', role: 'Backend', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: '3', name: 'Mike Williams', role: 'ML Engineer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
  ];

  const profileLinks = [
    { label: 'LinkedIn', href: profile.linkedin },
    { label: 'GitHub', href: profile.github },
    { label: 'Portfolio', href: profile.portfolio },
    { label: 'Resume', href: profile.resume },
  ];

  function openEditor() {
    setDraft(profile);
    setIsEditing(true);
  }

  function saveEditor(e: React.FormEvent) {
    e.preventDefault();
    setProfile(draft);
    setIsEditing(false);
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-lg border border-[#3b1d1d] bg-[linear-gradient(135deg,#161313_0%,#191414_58%,#241414_100%)] px-6 py-8 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(122,16,36,0.22),transparent_36%)]" />
        <button
          type="button"
          onClick={openEditor}
          className="absolute right-5 top-5 z-20 rounded-full border border-white/12 bg-white/6 p-2 text-white/75 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-white"
          aria-label="Edit dashboard profile"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
          </svg>
        </button>
        <div className="relative z-10">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.38em] text-[#c9a84c]">System Authorization Confirmed</div>
          <h1 className="flex flex-wrap items-baseline gap-x-4 gap-y-0 whitespace-nowrap font-display text-[3.6rem] leading-none uppercase tracking-[-0.07em] sm:text-[5.25rem] lg:text-[6.5rem]">
            <span className="text-white">Welcome</span>
            <span className="text-[#b30d0d]">Player {displayUserId}</span>
          </h1>
        </div>
        <div className="pointer-events-none absolute bottom-4 right-4 select-none font-headline text-6xl text-white/5">♠</div>
      </div>

      <section className="rounded-lg border border-white/10 bg-black/80 p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <span className="font-display text-2xl text-primary">P4</span>
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#c9a84c]">Player Profile</div>
            <h2 className="font-display text-3xl uppercase tracking-[-0.04em] text-white">{profile.headline}</h2>
          </div>
        </div>
        <p className="max-w-4xl font-body text-base leading-8 text-white/75">{profile.bio}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {profileLinks.map((link) => (
            <a
              key={link.label}
              href={`https://${link.href.replace(/^https?:\/\//, '')}`}
              target="_blank"
              rel="noreferrer"
              className="group rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:border-primary/40 hover:bg-primary/10"
            >
              <div className="font-body text-lg font-semibold text-white">{link.label}</div>
              <div className="mt-2 break-all font-body text-sm text-white/60 transition-colors group-hover:text-white/78">{link.href}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-primary/20 bg-[linear-gradient(135deg,#120f10_0%,#171112_55%,#1e1214_100%)] p-6 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src="https://api.dicebear.com/7.x/shapes/svg?seed=NeonDealers" alt="The Neon Dealers" className="h-20 w-20 rounded-2xl border border-primary/30 bg-black/40 p-2" />
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#c9a84c]">Team Overview</div>
              <h2 className="font-display text-3xl uppercase tracking-[-0.04em] text-white">The Neon Dealers</h2>
              <p className="mt-2 max-w-2xl font-body text-sm uppercase tracking-[0.14em] text-primary/85">We ship fast, pitch sharp, and build for the judges first.</p>
            </div>
          </div>
          <button type="button" onClick={onBrowseTeams} className="rounded border border-white/10 bg-white/5 px-4 py-2 font-body text-xs font-bold uppercase tracking-[0.08em] text-white/75 transition-colors hover:bg-white/10 hover:text-white">View All Teams</button>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-lg border border-white/10 bg-black/35 p-5">
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">Team Bio</div>
            <p className="font-body text-sm leading-7 text-white/75">Building an AI-powered project copilot for hackathon teams that helps with ideation, task planning, and presentation prep. We care about strong UX, clear storytelling, and shipping a demo that feels production-ready.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">Motto</div>
                <div className="mt-2 font-body text-white">Build clean. Demo loud.</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">Looking For</div>
                <div className="mt-2 font-body text-white">One designer or ML teammate</div>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/35 p-5">
            <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">Teammates</div>
            <div className="space-y-3">
              {teammates.map((teammate) => (
                <button key={teammate.id} type="button" onClick={onBrowsePlayers} className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/10">
                  <img src={teammate.avatar} alt={teammate.name} className="h-12 w-12 rounded-full border border-primary/30" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-body font-semibold text-white">{teammate.name}</div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">{teammate.role}</div>
                  </div>
                  <Icon name="arrow_forward" className="text-white/45" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditing(false)} />
          <form onSubmit={saveEditor} className="relative z-10 w-full max-w-3xl rounded-lg border border-primary/30 bg-[#141011] p-6 shadow-[0_0_40px_rgba(122,16,36,0.18)]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-display text-3xl uppercase tracking-[-0.04em] text-white">Edit Dashboard</h2>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.24em] text-[#c9a84c]">Update your bio and links</p>
              </div>
              <button type="button" onClick={() => setIsEditing(false)} className="rounded-full border border-white/10 bg-white/5 p-2 text-white/65 transition-colors hover:text-white">
                <Icon name="close" />
              </button>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-white/55">Headline</label>
                <input type="text" value={draft.headline} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-body text-white placeholder:text-white/30 focus:border-primary focus:outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-white/55">Bio</label>
                <textarea rows={5} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} className="w-full resize-none rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-body text-white placeholder:text-white/30 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-white/55">LinkedIn</label>
                <input type="text" value={draft.linkedin} onChange={(e) => setDraft({ ...draft, linkedin: e.target.value })} className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-body text-white placeholder:text-white/30 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-white/55">GitHub</label>
                <input type="text" value={draft.github} onChange={(e) => setDraft({ ...draft, github: e.target.value })} className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-body text-white placeholder:text-white/30 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-white/55">Portfolio</label>
                <input type="text" value={draft.portfolio} onChange={(e) => setDraft({ ...draft, portfolio: e.target.value })} className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-body text-white placeholder:text-white/30 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-white/55">Resume</label>
                <input type="text" value={draft.resume} onChange={(e) => setDraft({ ...draft, resume: e.target.value })} className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-body text-white placeholder:text-white/30 focus:border-primary focus:outline-none" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-6">
              <button type="button" onClick={() => setIsEditing(false)} className="rounded border border-white/10 bg-white/5 px-5 py-2.5 font-body text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white">Cancel</button>
              <button type="submit" className="rounded border border-primary/50 bg-primary/10 px-5 py-2.5 font-body text-sm font-semibold text-primary transition-colors hover:bg-primary/20">Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
