import { useAuth } from '@clerk/astro/react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PROFILE_CHANGED_EVENT, TEAM_CHANGED_EVENT } from '@/lib/dashboard-events';
import TeamInvitationsPanel from './TeamInvitationsPanel';
import DiscordCopy from '@/components/ui/DiscordCopy';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
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

function normalizeHref(value: string) {
  if (!value.trim()) return '';
  if (/^http:\/\//i.test(value)) return value.replace(/^http:/i, 'https:');
  return /^https:\/\//i.test(value) ? value : `https://${value}`;
}

function mapProfileData(
  profile: {
    display_name?: string | null;
    bio?: string | null;
    linkedin_url?: string | null;
    github_url?: string | null;
    portfolio_url?: string | null;
    discord_username?: string | null;
    looking_for_team?: boolean | null;
  } | null,
): ProfileData {
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
  return fullName || 'Anonymous Hacker';
}

function getMemberInitials(member: TeamMember) {
  const first = member.first_name?.[0] ?? '';
  const last = member.last_name?.[0] ?? '';
  return (first + last).toUpperCase() || '??';
}

export default function ProfileCard() {
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

  async function loadDashboardData(cancelledRef?: { current: boolean }) {
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

    if (cancelledRef?.current) return;

    setClerkFirstName(firstName);
    setProfile(mappedProfile);
    setDraft({
      ...mappedProfile,
      displayName: mappedProfile.displayName || firstName,
    });
    setTeam(nextTeam);
    if (hasLoadError) {
      setLoadError('Some data could not be loaded.');
    }
    setIsLoading(false);
  }

  useEffect(() => {
    if (!isLoaded) return;

    const cancelled = { current: false };

    void loadDashboardData(cancelled);

    const handleRefresh = () => {
      void loadDashboardData(cancelled);
    };

    window.addEventListener(PROFILE_CHANGED_EVENT, handleRefresh);
    window.addEventListener(TEAM_CHANGED_EVENT, handleRefresh);

    return () => {
      cancelled.current = true;
      window.removeEventListener(PROFILE_CHANGED_EVENT, handleRefresh);
      window.removeEventListener(TEAM_CHANGED_EVENT, handleRefresh);
    };
  }, [isLoaded]);

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
          <p className="font-mono text-sm uppercase tracking-widest text-white/50">Loading...</p>
        </div>
      </div>
    );
  }

  const welcomeName = profile.displayName || clerkFirstName;
  const teamName = team?.name || 'No Team Yet';
  const teamDescription = team?.description?.trim() || '';
  const availableSlots = team ? Math.max(team.max_size - team.members.length, 0) : null;

  const socials = [
    { label: 'LinkedIn', value: profile.linkedin, href: normalizeHref(profile.linkedin) },
    { label: 'GitHub', value: profile.github, href: normalizeHref(profile.github) },
    { label: 'Portfolio', value: profile.portfolio, href: normalizeHref(profile.portfolio) },
  ].filter((s) => s.value);

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
    <>
      {loadError && (
        <div className="rounded border border-red/30 bg-red/10 px-4 py-3 text-sm text-red-200">
          {loadError}
        </div>
      )}

      {/* Unified container — profile + team + invitations */}
      <div className="relative overflow-hidden bg-[#1a0a0e]">

        <div className="relative z-10 space-y-8 px-8 py-6">
          {/* Top bar: edit */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={openEditor}
              className="button-heading ml-auto text-[10px] uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white/70"
            >
              Edit &rarr;
            </button>
          </div>

          {/* Name with Welcome prefix */}
          <div>
            <h1 className="font-display text-[clamp(2.5rem,8vw,5rem)] leading-[0.9] uppercase tracking-[-0.04em]">
              <span className="text-white">Welcome,</span>{' '}
              <span className="text-[#C41E3A]">{welcomeName}</span>
            </h1>

            {/* Bio */}
            {profile.bio && (
              <p className="mt-4 max-w-2xl font-body text-[15px] leading-relaxed text-white/55">
                {profile.bio}
              </p>
            )}

            {/* Socials — inline, minimal */}
            {(profile.discord || socials.length > 0) && (
              <div className="mt-6 space-y-3">
                {profile.discord && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#5865F2]">Discord</span>
                    <DiscordCopy username={profile.discord} />
                  </div>
                )}
                {socials.length > 0 && (
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    {socials.map((s) => (
                      <a
                        key={s.label}
                        href={s.href}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/40 transition-colors hover:text-red"
                      >
                        {s.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/8" />

          {/* Team section (no box) */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl uppercase tracking-[-0.03em] text-white">
                  {teamName}
                </h2>
                {teamDescription && (
                  <p className="mt-2 max-w-xl font-body text-sm text-white/45">{teamDescription}</p>
                )}
              </div>
              <a
                href="/dashboard/teams"
                className="button-heading shrink-0 text-[10px] uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white/70"
              >
                Browse teams &rarr;
              </a>
            </div>

            {team ? (
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <div className="rounded border border-white/8 bg-white/4 px-4 py-2.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                    Code
                  </span>
                  <span className="ml-2 font-mono text-sm text-white/80">{team.invite_code}</span>
                </div>
                <div className="rounded border border-white/8 bg-white/4 px-4 py-2.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                    Slots
                  </span>
                  <span className="ml-2 font-mono text-sm text-white/80">
                    {availableSlots} / {team.max_size} open
                  </span>
                </div>
                <div className="h-6 w-px bg-white/8" />
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {team.members.map((member) =>
                      member.avatar_url ? (
                        <img
                          key={member.id}
                          src={member.avatar_url}
                          alt={getMemberName(member)}
                          className="h-8 w-8 rounded-full border-2 border-black-card"
                          title={getMemberName(member)}
                        />
                      ) : (
                        <div
                          key={member.id}
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-black-card bg-white/10 font-mono text-[10px] text-white/60"
                          title={getMemberName(member)}
                        >
                          {getMemberInitials(member)}
                        </div>
                      ),
                    )}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
                    {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="font-body text-sm text-white/50">You're not on a team yet.</p>
                <a
                  href="/dashboard/teams"
                  className="inline-flex items-center gap-2 rounded border border-red/40 bg-red/10 px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-red-bright transition-all hover:border-red/60 hover:bg-red/20 hover:shadow-[0_0_20px_rgba(196,30,58,0.15)]"
                >
                  Find a team &rarr;
                </a>
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/30">
                  Browse teams, request to join, or create your own
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/8" />

          {/* Invitations section */}
          <div>
            <TeamInvitationsPanel />
          </div>
        </div>
      </div>

      {/* Editor modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsEditing(false)}
          />
          <form
            onSubmit={saveEditor}
            className="relative z-10 w-full max-w-2xl rounded-lg border border-primary/30 bg-[#141011] p-6 shadow-[0_0_40px_rgba(122,16,36,0.18)]"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl uppercase tracking-[-0.03em] text-white">
                  Edit Profile
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="button-heading text-lg text-white/50 transition-colors hover:text-white"
              >
                &times;
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={draft.displayName}
                  onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
                  className="w-full rounded border border-white/10 bg-black/40 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/25 focus:border-red focus:outline-none"
                  placeholder="How should your name appear?"
                />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                  Bio
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={draft.bio}
                  onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                  className="w-full resize-none rounded border border-white/10 bg-black/40 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/25 focus:border-red focus:outline-none"
                  placeholder="Skills, interests, what you want to build..."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                    LinkedIn
                  </label>
                  <input
                    type="text"
                    value={draft.linkedin}
                    onChange={(e) => setDraft({ ...draft, linkedin: e.target.value })}
                    className="w-full rounded border border-white/10 bg-black/40 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/25 focus:border-red focus:outline-none"
                    placeholder="linkedin.com/in/..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                    Discord
                  </label>
                  <input
                    type="text"
                    value={draft.discord}
                    onChange={(e) => setDraft({ ...draft, discord: e.target.value })}
                    className="w-full rounded border border-white/10 bg-black/40 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/25 focus:border-red focus:outline-none"
                    placeholder="username"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                    GitHub
                  </label>
                  <input
                    type="text"
                    value={draft.github}
                    onChange={(e) => setDraft({ ...draft, github: e.target.value })}
                    className="w-full rounded border border-white/10 bg-black/40 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/25 focus:border-red focus:outline-none"
                    placeholder="github.com/..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                    Portfolio
                  </label>
                  <input
                    type="text"
                    value={draft.portfolio}
                    onChange={(e) => setDraft({ ...draft, portfolio: e.target.value })}
                    className="w-full rounded border border-white/10 bg-black/40 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/25 focus:border-red focus:outline-none"
                    placeholder="your-site.com"
                  />
                </div>
              </div>
              <label className="flex items-center gap-3 rounded border border-white/8 bg-black/30 px-4 py-2.5 text-white/70">
                <input
                  type="checkbox"
                  checked={draft.lookingForTeam}
                  onChange={(e) => setDraft({ ...draft, lookingForTeam: e.target.checked })}
                  className="h-4 w-4 accent-red"
                />
                <span className="font-body text-sm">Show me as looking for a team</span>
              </label>
            </div>
            {saveError && (
              <div className="mt-4 rounded border border-red/30 bg-red/10 px-4 py-3 text-sm text-red-200">
                {saveError}
              </div>
            )}
            <div className="mt-5 flex justify-end gap-3 border-t border-white/8 pt-5">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="button-heading px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-white/50 transition-colors hover:text-white/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !draft.displayName.trim()}
                className="button-heading rounded border border-red/50 bg-red/10 px-5 py-2 text-[11px] uppercase tracking-[0.15em] text-red transition-colors hover:bg-red/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
