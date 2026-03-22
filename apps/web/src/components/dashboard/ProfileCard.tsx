import { useAuth } from '@clerk/astro/react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/ui/Icon';

interface ProfileCardProps {
  onBrowsePlayers?: () => void;
  onBrowseTeams?: () => void;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface TeamData {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  max_size: number;
  members: TeamMember[];
}

interface ProfileData {
  displayName: string;
  bio: string;
  linkedin: string;
  github: string;
  portfolio: string;
  discord: string;
  lookingForTeam: boolean;
}

const EMPTY_PROFILE: ProfileData = {
  displayName: '',
  bio: '',
  linkedin: '',
  github: '',
  portfolio: '',
  discord: '',
  lookingForTeam: false,
};

function getClerkFirstName() {
  const clerkUser = window.Clerk?.user;
  return (
    clerkUser?.firstName?.trim() ||
    clerkUser?.username?.trim() ||
    clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'Hacker'
  );
}

function getProfileInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return '??';

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function normalizeHref(value: string) {
  if (!value.trim()) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function mapProfileData(profile: {
  display_name?: string | null;
  bio?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  discord_username?: string | null;
  looking_for_team?: boolean | null;
} | null): ProfileData {
  if (!profile) return EMPTY_PROFILE;

  return {
    displayName: profile.display_name?.trim() || '',
    bio: profile.bio?.trim() || '',
    linkedin: profile.linkedin_url?.trim() || '',
    github: profile.github_url?.trim() || '',
    portfolio: profile.portfolio_url?.trim() || '',
    discord: profile.discord_username?.trim() || '',
    lookingForTeam: profile.looking_for_team ?? false,
  };
}

function getMemberName(member: TeamMember) {
  const fullName = `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim();
  return fullName || member.email || 'Anonymous Hacker';
}

export default function ProfileCard({ onBrowsePlayers, onBrowseTeams }: ProfileCardProps) {
  const { isLoaded } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [clerkFirstName, setClerkFirstName] = useState('Hacker');
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [draft, setDraft] = useState<ProfileData>(EMPTY_PROFILE);
  const [team, setTeam] = useState<TeamData | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;

    async function loadDashboardData() {
      setIsLoading(true);
      setLoadError(null);

      const firstName = getClerkFirstName();
      let mappedProfile = EMPTY_PROFILE;
      let nextTeam: TeamData | null = null;
      let hasLoadError = false;

      try {
        const profileResult = await api.getProfile();
        mappedProfile = mapProfileData(profileResult);
      } catch {
        hasLoadError = true;
      }

      try {
        nextTeam = await api.getMyTeam();
      } catch {
        hasLoadError = true;
      }

      try {
        if (cancelled) return;

        setClerkFirstName(firstName);
        setProfile(mappedProfile);
        setDraft({
          ...mappedProfile,
          displayName: mappedProfile.displayName || firstName,
        });
        setTeam(nextTeam);
        if (hasLoadError) {
          setLoadError('Some team finder data could not be loaded.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [isLoaded]);

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
          <p className="font-mono text-sm uppercase tracking-widest text-white/50">Loading profile...</p>
        </div>
      </div>
    );
  }

  const welcomeName = profile.displayName || clerkFirstName;
  const profileInitials = getProfileInitials(welcomeName);
  const teamName = team?.name || 'No Team Yet';
  const teamDescription = team?.description?.trim() || '';
  const availableSlots = team ? Math.max(team.max_size - team.members.length, 0) : null;

  const profileCards = [
    { label: 'LinkedIn', value: profile.linkedin, href: normalizeHref(profile.linkedin) },
    { label: 'GitHub', value: profile.github, href: normalizeHref(profile.github) },
    { label: 'Portfolio', value: profile.portfolio, href: normalizeHref(profile.portfolio) },
    { label: 'Discord', value: profile.discord, href: '' },
    { label: 'Team Status', value: profile.lookingForTeam ? 'Looking for team' : 'Not currently looking', href: '' },
  ];

  function openEditor() {
    setSaveError(null);
    setDraft({
      ...profile,
      displayName: profile.displayName || clerkFirstName,
    });
    setIsEditing(true);
  }

  async function saveEditor(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    try {
      const savedProfile = await api.upsertProfile({
        display_name: draft.displayName.trim(),
        bio: draft.bio.trim() || undefined,
        linkedin_url: draft.linkedin.trim() || undefined,
        github_url: draft.github.trim() || undefined,
        portfolio_url: draft.portfolio.trim() || undefined,
        discord_username: draft.discord.trim() || undefined,
        looking_for_team: draft.lookingForTeam,
      });

      const mappedProfile = mapProfileData(savedProfile);
      setProfile(mappedProfile);
      setDraft(mappedProfile);
      setIsEditing(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save your profile.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="rounded-lg border border-red/30 bg-red/10 px-4 py-3 text-sm text-red-200">
          {loadError}
        </div>
      )}

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
            <span className="text-[#b30d0d]">{welcomeName}</span>
          </h1>
        </div>
        <div className="pointer-events-none absolute bottom-4 right-4 select-none font-headline text-6xl text-white/5">SP</div>
      </div>

      <section className="rounded-lg border border-white/10 bg-black/80 p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <span className="font-display text-2xl text-primary">{profileInitials}</span>
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#c9a84c]">Player Profile</div>
            <h2 className="font-display text-3xl uppercase tracking-[-0.04em] text-white">{welcomeName}</h2>
          </div>
        </div>
        <p className="max-w-4xl font-body text-base leading-8 text-white/75">
          {profile.bio || 'No bio added yet.'}
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {profileCards.map((card) => {
            const content = (
              <>
                <div className="font-body text-lg font-semibold text-white">{card.label}</div>
                <div className="mt-2 break-all font-body text-sm text-white/60">
                  {card.value || 'Not added yet'}
                </div>
              </>
            );

            if (!card.href) {
              return (
                <div
                  key={card.label}
                  className="rounded-lg border border-white/10 bg-white/5 p-4"
                >
                  {content}
                </div>
              );
            }

            return (
              <a
                key={card.label}
                href={card.href}
                target="_blank"
                rel="noreferrer"
                className="group rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:border-primary/40 hover:bg-primary/10"
              >
                <div className="font-body text-lg font-semibold text-white">{card.label}</div>
                <div className="mt-2 break-all font-body text-sm text-white/60 transition-colors group-hover:text-white/78">
                  {card.value}
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-primary/20 bg-[linear-gradient(135deg,#120f10_0%,#171112_55%,#1e1214_100%)] p-6 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={team ? `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(team.name)}` : 'https://api.dicebear.com/7.x/shapes/svg?seed=NoTeam'}
              alt={teamName}
              className="h-20 w-20 rounded-2xl border border-primary/30 bg-black/40 p-2"
            />
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#c9a84c]">Team Overview</div>
              <h2 className="font-display text-3xl uppercase tracking-[-0.04em] text-white">{teamName}</h2>
              <p className="mt-2 max-w-2xl font-body text-sm uppercase tracking-[0.14em] text-primary/85">
                {team ? 'Your live crew data is shown here.' : 'Create or join a team to populate this section.'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onBrowseTeams} className="rounded border border-white/10 bg-white/5 px-4 py-2 font-body text-xs font-bold uppercase tracking-[0.08em] text-white/75 transition-colors hover:bg-white/10 hover:text-white">View All Teams</button>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-lg border border-white/10 bg-black/35 p-5">
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">Team Bio</div>
            <p className="font-body text-sm leading-7 text-white/75">
              {teamDescription || 'No team description added yet.'}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">Invite Code</div>
                <div className="mt-2 break-all font-body text-white">{team?.invite_code || '-'}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">Open Slots</div>
                <div className="mt-2 font-body text-white">
                  {team && availableSlots !== null ? `${availableSlots} of ${team.max_size}` : '-'}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/35 p-5">
            <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">Teammates</div>
            <div className="space-y-3">
              {team?.members.length ? (
                team.members.map((member) => (
                  <button key={member.id} type="button" onClick={onBrowsePlayers} className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/10">
                    <img src={member.avatar_url || 'https://via.placeholder.com/48'} alt={getMemberName(member)} className="h-12 w-12 rounded-full border border-primary/30" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-body font-semibold text-white">{getMemberName(member)}</div>
                      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">
                        {member.role === 'leader' ? 'Leader' : 'Member'}
                      </div>
                    </div>
                    <Icon name="arrow_forward" className="text-white/45" />
                  </button>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-white/10 bg-white/5 p-4 text-sm text-white/55">
                  No teammates yet.
                </div>
              )}
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
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.24em] text-[#c9a84c]">Update your team finder profile</p>
              </div>
              <button type="button" onClick={() => setIsEditing(false)} className="rounded-full border border-white/10 bg-white/5 p-2 text-white/65 transition-colors hover:text-white">
                <Icon name="close" />
              </button>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-white/55">Display Name</label>
                <input type="text" required maxLength={100} value={draft.displayName} onChange={(e) => setDraft({ ...draft, displayName: e.target.value })} className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-body text-white placeholder:text-white/30 focus:border-primary focus:outline-none" placeholder="How should your name appear?" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-white/55">Bio</label>
                <textarea rows={5} maxLength={500} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} className="w-full resize-none rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-body text-white placeholder:text-white/30 focus:border-primary focus:outline-none" placeholder="Tell others about your skills, interests, and what you want to build." />
              </div>
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-white/55">LinkedIn</label>
                <input type="text" value={draft.linkedin} onChange={(e) => setDraft({ ...draft, linkedin: e.target.value })} className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-body text-white placeholder:text-white/30 focus:border-primary focus:outline-none" placeholder="linkedin.com/in/..." />
              </div>
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-white/55">GitHub</label>
                <input type="text" value={draft.github} onChange={(e) => setDraft({ ...draft, github: e.target.value })} className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-body text-white placeholder:text-white/30 focus:border-primary focus:outline-none" placeholder="github.com/..." />
              </div>
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-white/55">Portfolio</label>
                <input type="text" value={draft.portfolio} onChange={(e) => setDraft({ ...draft, portfolio: e.target.value })} className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-body text-white placeholder:text-white/30 focus:border-primary focus:outline-none" placeholder="your-site.com" />
              </div>
              <div>
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-white/55">Discord</label>
                <input type="text" value={draft.discord} onChange={(e) => setDraft({ ...draft, discord: e.target.value })} className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-body text-white placeholder:text-white/30 focus:border-primary focus:outline-none" placeholder="username" />
              </div>
              <label className="md:col-span-2 flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white/80">
                <input
                  type="checkbox"
                  checked={draft.lookingForTeam}
                  onChange={(e) => setDraft({ ...draft, lookingForTeam: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
                <span className="font-body text-sm">Show me as actively looking for a team</span>
              </label>
            </div>
            {saveError && (
              <div className="mt-5 rounded border border-red/30 bg-red/10 px-4 py-3 text-sm text-red-200">
                {saveError}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-6">
              <button type="button" onClick={() => setIsEditing(false)} className="rounded border border-white/10 bg-white/5 px-5 py-2.5 font-body text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white">Cancel</button>
              <button type="submit" disabled={isSaving || !draft.displayName.trim()} className="rounded border border-primary/50 bg-primary/10 px-5 py-2.5 font-body text-sm font-semibold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
