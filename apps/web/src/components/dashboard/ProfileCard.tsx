import { useAuth } from '@clerk/astro/react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PROFILE_CHANGED_EVENT, TEAM_CHANGED_EVENT, OPEN_EDITOR_FOR_CONFIRM_EVENT, PROFILE_SAVED_FOR_CONFIRM_EVENT } from '@/lib/dashboard-events';
import TeamInvitationsPanel from './TeamInvitationsPanel';
import DiscordCopy from '@/components/ui/DiscordCopy';
import LoadingHand from './casino/LoadingHand';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  discord_username: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
}

interface TeamData {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  max_size: number;
  members: TeamMember[];
  viewer_role: string;
}

interface ProfileData {
  displayName: string;
  bio: string;
  linkedin: string;
  github: string;
  portfolio: string;
  discord: string;
  lookingForTeam: boolean;
  university: string;
  major: string;
}

const EMPTY_PROFILE: ProfileData = {
  displayName: '',
  bio: '',
  linkedin: '',
  github: '',
  portfolio: '',
  discord: '',
  lookingForTeam: false,
  university: '',
  major: '',
};

const CONFIRM_REQUIRED_FIELDS = ['displayName', 'bio', 'linkedin', 'discord'] as const;

function validateConfirmFields(profile: ProfileData): string[] {
  const missing: string[] = [];
  if (!profile.displayName.trim()) missing.push('displayName');
  if (!profile.bio.trim()) missing.push('bio');
  if (!profile.linkedin.trim()) missing.push('linkedin');
  if (!profile.discord.trim()) missing.push('discord');
  return missing;
}

function isValidLinkedIn(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^https?:\/\//i.test(trimmed) || /linkedin\.com/i.test(trimmed);
}

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
    university?: string | null;
    major?: string | null;
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
    university: profile.university?.trim() || '',
    major: profile.major?.trim() || '',
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

function SocialIcon({ label }: { label: string }) {
  if (label === 'GitHub') {
    return (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (label === 'LinkedIn') {
    return (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.369A19.791 19.791 0 0015.558 3c-.206.375-.444.88-.608 1.275a18.27 18.27 0 00-5.9 0A12.64 12.64 0 008.442 3a19.736 19.736 0 00-4.76 1.369C.533 9.037-.32 13.579.107 18.057a19.9 19.9 0 005.993 3.043c.485-.666.918-1.37 1.296-2.106-.714-.268-1.396-.598-2.038-.98.17-.124.336-.253.496-.387 3.93 1.848 8.188 1.848 12.072 0 .162.134.328.263.496.387-.644.383-1.327.713-2.042.98.378.737.812 1.44 1.297 2.106a19.88 19.88 0 005.995-3.043c.5-5.19-.854-9.691-3.355-13.688zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.334.955-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.961 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.334.955-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z" />
    </svg>
  );
}

function InviteCodeCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group/code flex items-center rounded border border-white/8 bg-white/4 px-4 py-2.5 transition-colors hover:border-white/15 hover:bg-white/[0.06]"
      title="Click to copy invite code"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Code</span>
      <span className="ml-2 font-mono text-sm font-semibold text-white/90">{code}</span>
      <span className={`ml-2 transition-all ${copied ? 'opacity-100' : 'opacity-0 group-hover/code:opacity-60'}`}>
        {copied ? (
          <svg className="h-3.5 w-3.5 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </span>
      {copied && (
        <span className="ml-1 font-mono text-[9px] uppercase tracking-wider text-[#00ff88]">Copied</span>
      )}
    </button>
  );
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
  const [confirmAfterSave, setConfirmAfterSave] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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

    const handleOpenForConfirm = () => {
      openEditor(true);
    };

    window.addEventListener(PROFILE_CHANGED_EVENT, handleRefresh);
    window.addEventListener(TEAM_CHANGED_EVENT, handleRefresh);
    window.addEventListener(OPEN_EDITOR_FOR_CONFIRM_EVENT, handleOpenForConfirm);

    return () => {
      cancelled.current = true;
      window.removeEventListener(PROFILE_CHANGED_EVENT, handleRefresh);
      window.removeEventListener(TEAM_CHANGED_EVENT, handleRefresh);
      window.removeEventListener(OPEN_EDITOR_FOR_CONFIRM_EVENT, handleOpenForConfirm);
    };
  }, [isLoaded]);

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingHand label="Dealing your profile..." />
      </div>
    );
  }

  const welcomeName = profile.displayName || clerkFirstName;
  const teamName = team?.name || 'No Team Yet';
  const teamDescription = team?.description?.trim() || '';
  const availableSlots = team ? Math.max(team.max_size - team.members.length, 0) : null;
  const isLeader = team?.viewer_role === 'leader';
  const isFull = team ? team.members.length >= team.max_size : false;

  const socials = [
    { label: 'LinkedIn', value: profile.linkedin, href: normalizeHref(profile.linkedin) },
    { label: 'GitHub', value: profile.github, href: normalizeHref(profile.github) },
    { label: 'Portfolio', value: profile.portfolio, href: normalizeHref(profile.portfolio) },
  ].filter((s) => s.value);

  function openEditor(forConfirm = false) {
    setSaveError(null);
    setValidationErrors(forConfirm ? validateConfirmFields(profile) : []);
    setConfirmAfterSave(forConfirm);
    setDraft({
      ...profile,
      displayName: profile.displayName || clerkFirstName,
    });
    setIsEditing(true);
  }

  async function saveEditor(e: React.FormEvent) {
    e.preventDefault();

    // Validate required fields when saving for confirmation
    if (confirmAfterSave) {
      const missing = validateConfirmFields(draft);
      if (missing.length > 0) {
        setValidationErrors(missing);
        setSaveError('Please fill in all required fields to confirm your spot.');
        return;
      }
      if (!isValidLinkedIn(draft.linkedin)) {
        setValidationErrors(['linkedin']);
        setSaveError('Please enter a valid LinkedIn URL.');
        return;
      }
    }

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
        major: draft.major.trim() || undefined,
      });

      const mappedProfile = mapProfileData(savedProfile);
      setProfile(mappedProfile);
      setDraft(mappedProfile);
      setIsEditing(false);
      setValidationErrors([]);

      // Auto-trigger confirmation after successful save
      if (confirmAfterSave) {
        setConfirmAfterSave(false);
        window.dispatchEvent(new CustomEvent(PROFILE_SAVED_FOR_CONFIRM_EVENT));
      }
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
              onClick={() => openEditor()}
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
                    <span className="text-[#5865F2]">
                      <DiscordIcon />
                    </span>
                    <DiscordCopy username={profile.discord} className="font-mono text-[#5865F2]" />
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
                        className="flex items-center justify-center text-white/40 transition-colors hover:text-red"
                        title={s.label}
                        aria-label={s.label}
                      >
                        <SocialIcon label={s.label} />
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
                <h2 className="font-display text-2xl uppercase tracking-[-0.03em]">
                  <span className="text-white">Team </span>
                  <span className="text-[#C41E3A]">{teamName}</span>
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
              <div className="mt-6 space-y-5">
                {/* Code & Slots row */}
                <div className="flex flex-wrap items-stretch gap-3">
                  <InviteCodeCard code={team.invite_code} />
                  <div className="flex items-center rounded border border-white/8 bg-white/4 px-4 py-2.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                      Slots
                    </span>
                    <span className="ml-2 font-mono text-sm text-white/80">
                      {availableSlots} / {team.max_size} open
                    </span>
                  </div>
                </div>

                {/* Team members list */}
                <div className="space-y-2">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                    Team Members ({team.members.length})
                  </p>
                  <div className="space-y-1.5">
                    {team.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 rounded border border-white/8 bg-white/[0.03] px-4 py-3"
                      >
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={getMemberName(member)}
                            className="h-9 w-9 shrink-0 rounded-full border-2 border-white/15 object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/15 bg-white/10 font-mono text-[10px] font-bold text-white/70">
                            {getMemberInitials(member)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-white">{getMemberName(member)}</span>
                            {member.role === 'leader' && (
                              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-white/50">Leader</span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-3">
                            {member.discord_username && (
                              <span className="flex items-center gap-1 text-xs">
                                <span className="text-[#5865F2]/80">
                                  <DiscordIcon />
                                </span>
                                <DiscordCopy
                                  username={member.discord_username}
                                  size="sm"
                                  className="font-mono text-[#5865F2]"
                                />
                              </span>
                            )}
                            {member.linkedin_url && (
                              <a
                                href={member.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-white/60 hover:text-white/80"
                                title="LinkedIn"
                                aria-label="LinkedIn"
                              >
                                <SocialIcon label="LinkedIn" />
                              </a>
                            )}
                            {member.github_url && (
                              <a
                                href={normalizeHref(member.github_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-white/60 hover:text-white/80"
                                title="GitHub"
                                aria-label="GitHub"
                              >
                                <SocialIcon label="GitHub" />
                              </a>
                            )}
                            {member.portfolio_url && (
                              <a
                                href={normalizeHref(member.portfolio_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-white/60 hover:text-white/80"
                                title="Portfolio"
                                aria-label="Portfolio"
                              >
                                <SocialIcon label="Portfolio" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leader hint or full roster message */}
                {isFull ? (
                  <div className="mt-4 rounded border border-[#00ff88]/20 bg-[#00ff88]/[0.06] px-4 py-3">
                    <p className="font-mono text-sm font-bold uppercase tracking-wider text-[#00ff88]" style={{ textShadow: '0 0 12px rgba(0,255,136,0.3)' }}>
                      Good sh*t — you got a whole roster now
                    </p>
                  </div>
                ) : isLeader ? (
                  <div className="mt-4 rounded border border-white/8 bg-white/[0.03] px-4 py-3">
                    <p className="font-body text-sm text-white/50">
                      Invite participants by clicking on their profile in the{' '}
                      <a href="#players" className="font-semibold text-red-bright underline decoration-red/30 hover:decoration-red">
                        Participants
                      </a>{' '}
                      section below.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-4">
                <a
                  href="/dashboard/teams"
                  className="inline-flex items-center gap-2 rounded border border-red/40 bg-red/10 px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-red-bright transition-all hover:border-red/60 hover:bg-red/20 hover:shadow-[0_0_20px_rgba(196,30,58,0.15)]"
                >
                  Find a team &rarr;
                </a>
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
            {confirmAfterSave && (
              <div className="mb-4 rounded border border-[#C41E3A]/30 bg-[#C41E3A]/[0.06] px-4 py-3 font-body text-xs text-white/60">
                Fill in the required fields below to confirm your spot.
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className={`mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] ${validationErrors.includes('displayName') ? 'text-[#C41E3A]' : 'text-white/45'}`}>
                  Display Name {confirmAfterSave && <span className="text-[#C41E3A]">*</span>}
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={draft.displayName}
                  onChange={(e) => { setDraft({ ...draft, displayName: e.target.value }); setValidationErrors(v => v.filter(f => f !== 'displayName')); }}
                  className={`w-full rounded border bg-black/40 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/25 focus:outline-none ${validationErrors.includes('displayName') ? 'border-[#C41E3A]/50 focus:border-[#C41E3A]' : 'border-white/10 focus:border-red'}`}
                  placeholder="How should your name appear?"
                />
              </div>
              <div>
                <label className={`mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] ${validationErrors.includes('bio') ? 'text-[#C41E3A]' : 'text-white/45'}`}>
                  Bio {confirmAfterSave && <span className="text-[#C41E3A]">*</span>}
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={draft.bio}
                  onChange={(e) => { setDraft({ ...draft, bio: e.target.value }); setValidationErrors(v => v.filter(f => f !== 'bio')); }}
                  className={`w-full resize-none rounded border bg-black/40 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/25 focus:outline-none ${validationErrors.includes('bio') ? 'border-[#C41E3A]/50 focus:border-[#C41E3A]' : 'border-white/10 focus:border-red'}`}
                  placeholder="Skills, interests, what you want to build..."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={`mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] ${validationErrors.includes('linkedin') ? 'text-[#C41E3A]' : 'text-white/45'}`}>
                    LinkedIn {confirmAfterSave && <span className="text-[#C41E3A]">*</span>}
                  </label>
                  <input
                    type="text"
                    value={draft.linkedin}
                    onChange={(e) => { setDraft({ ...draft, linkedin: e.target.value }); setValidationErrors(v => v.filter(f => f !== 'linkedin')); }}
                    className={`w-full rounded border bg-black/40 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/25 focus:outline-none ${validationErrors.includes('linkedin') ? 'border-[#C41E3A]/50 focus:border-[#C41E3A]' : 'border-white/10 focus:border-red'}`}
                    placeholder="linkedin.com/in/..."
                  />
                </div>
                <div>
                  <label className={`mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] ${validationErrors.includes('discord') ? 'text-[#C41E3A]' : 'text-white/45'}`}>
                    Discord {confirmAfterSave && <span className="text-[#C41E3A]">*</span>}
                  </label>
                  <input
                    type="text"
                    value={draft.discord}
                    onChange={(e) => { setDraft({ ...draft, discord: e.target.value }); setValidationErrors(v => v.filter(f => f !== 'discord')); }}
                    className={`w-full rounded border bg-black/40 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/25 focus:outline-none ${validationErrors.includes('discord') ? 'border-[#C41E3A]/50 focus:border-[#C41E3A]' : 'border-white/10 focus:border-red'}`}
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
              {/* University (read-only) + Major (editable) — only shown when populated */}
              {(profile.university || profile.major) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {profile.university && (
                    <div>
                      <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                        University <span className="text-white/25">(from application)</span>
                      </label>
                      <input
                        type="text"
                        value={draft.university}
                        readOnly
                        className="w-full cursor-not-allowed rounded border border-white/5 bg-white/[0.03] px-4 py-2.5 font-body text-sm text-white/40"
                      />
                    </div>
                  )}
                  {profile.major && (
                    <div>
                      <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                        Major
                      </label>
                      <input
                        type="text"
                        value={draft.major}
                        onChange={(e) => setDraft({ ...draft, major: e.target.value })}
                        className="w-full rounded border border-white/10 bg-black/40 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/25 focus:border-red focus:outline-none"
                        placeholder="Your major"
                      />
                    </div>
                  )}
                </div>
              )}
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
