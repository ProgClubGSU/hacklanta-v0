import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { TEAM_CHANGED_EVENT } from '@/lib/dashboard-events';
import { TRACKS } from '@/lib/tracks';

import JoinRequestManager from './JoinRequestManager';
import TeamDetailModal from './TeamDetailModal';
import CardSuitDivider from './casino/CardSuitDivider';
import LoadingHand from './casino/LoadingHand';
import PokerChipGraphic from './casino/PokerChipGraphic';
import TerminalPrompt from './casino/TerminalPrompt';

interface TeamMemberUser {
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface TeamMember {
  id: string;
  users: TeamMemberUser | null;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  tracks: string[] | null;
  team_members: TeamMember[];
  member_count: number;
  max_size: number;
  is_full: boolean;
  is_looking_for_members: boolean;
  invite_code: string;
  created_at: string;
}

interface MyTeam {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  max_size: number;
  viewer_role: string;
  members: Array<{
    user_id: string;
    role: string;
  }>;
}

const SUIT_SYMBOLS = ['S', 'D', 'C', 'H'];

function MemberAvatars({ team }: { team: Team }) {
  const members = team.team_members ?? [];
  const openSlots = Math.max(team.max_size - members.length, 0);

  return (
    <div className="flex items-center gap-1">
      {members.map((member) => {
        const user = member.users;
        const initials =
          `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase() || '?';

        return user?.avatar_url ? (
          <img
            key={member.id}
            src={user.avatar_url}
            alt=""
            className="h-6 w-6 rounded-full border border-[#1a1a1a] object-cover"
          />
        ) : (
          <div
            key={member.id}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-[#1a1a1a] bg-white/10 font-mono text-[8px] text-white/50"
          >
            {initials}
          </div>
        );
      })}

      {Array.from({ length: openSlots }).map((_, index) => (
        <div
          key={`slot-${index}`}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-white/12 text-[10px] text-white/12"
        >
          {SUIT_SYMBOLS[index % SUIT_SYMBOLS.length]}
        </div>
      ))}
    </div>
  );
}

const FEATURED_TEAM_ID = 'e74a677a-4442-4db2-a3b3-c77e5e8be031'; // auramaxxers

export default function TeamGrid() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [featuredTeam, setFeaturedTeam] = useState<Team | null>(null);
  const [myTeam, setMyTeam] = useState<MyTeam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTracks, setNewTracks] = useState<string[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoiningByCode, setIsJoiningByCode] = useState(false);
  const [isLeavingTeam, setIsLeavingTeam] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    void loadTeams();
  }, [showAvailableOnly]);

  useEffect(() => {
    const handleTeamChanged = () => {
      void loadTeams();
    };

    window.addEventListener(TEAM_CHANGED_EVENT, handleTeamChanged);
    return () => window.removeEventListener(TEAM_CHANGED_EVENT, handleTeamChanged);
  }, [showAvailableOnly]);

  async function loadTeams() {
    try {
      setIsLoading(true);
      setActionError(null);

      const [teamsResult, currentTeam] = await Promise.all([
        api.listTeams({ has_openings: showAvailableOnly || undefined }),
        api.getMyTeam(),
      ]);

      const allTeams = (teamsResult.data ?? []) as Team[];
      const featured = allTeams.find((t) => t.id === FEATURED_TEAM_ID) ?? null;
      setFeaturedTeam(featured);
      setTeams(allTeams.filter((t) => t.id !== FEATURED_TEAM_ID));
      setMyTeam(
        currentTeam
          ? {
              id: currentTeam.id,
              name: currentTeam.name,
              description: currentTeam.description,
              invite_code: currentTeam.invite_code,
              max_size: currentTeam.max_size,
              viewer_role: currentTeam.viewer_role,
              members: currentTeam.members.map((member: { user_id: string; role: string }) => ({
                user_id: member.user_id,
                role: member.role,
              })),
            }
          : null,
      );
    } catch (error) {
      console.error('Failed to load teams:', error);
      setTeams([]);
      setMyTeam(null);
      setActionError(error instanceof Error ? error.message : 'Failed to load teams.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateTeam(event: React.FormEvent) {
    event.preventDefault();
    if (!newName.trim()) return;

    try {
      setIsCreating(true);
      setActionError(null);
      await api.createTeam({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        tracks: newTracks.length > 0 ? newTracks : undefined,
      });
      setNewName('');
      setNewDesc('');
      setNewTracks([]);
      setShowCreateForm(false);
      await loadTeams();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to create team.');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleJoinByCode(event: React.FormEvent) {
    event.preventDefault();
    if (!joinCode.trim()) return;

    try {
      setIsJoiningByCode(true);
      setActionError(null);
      await api.joinTeam({ invite_code: joinCode });
      setJoinCode('');
      await loadTeams();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to join team.');
    } finally {
      setIsJoiningByCode(false);
    }
  }

  async function handleLeaveTeam() {
    if (!confirm('Are you sure you want to leave your current team?')) return;

    try {
      setIsLeavingTeam(true);
      setActionError(null);
      await api.leaveTeam();
      await loadTeams();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to leave team.');
    } finally {
      setIsLeavingTeam(false);
    }
  }

  function toggleTrack(trackName: string) {
    setNewTracks((previous) =>
      previous.includes(trackName)
        ? previous.filter((item) => item !== trackName)
        : [...previous, trackName],
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingHand label="Dealing teams..." />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl uppercase tracking-[-0.03em] text-white">Teams</h3>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-white/35">
              {teams.length} team{teams.length !== 1 ? 's' : ''} formed
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAvailableOnly(!showAvailableOnly)}
            className={`button-heading rounded px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] transition-all ${
              showAvailableOnly
                ? 'border border-red/30 bg-red/15 text-red'
                : 'border border-white/10 bg-white/5 text-white/40 hover:text-white/60'
            }`}
          >
            {showAvailableOnly ? 'Showing open' : 'Show open only'}
          </button>
        </div>

        {myTeam ? (
          <div className="rounded-lg border border-[#00ff88]/20 bg-[#00ff88]/5 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00ff88]">
                  Your team
                </p>
                <h4 className="mt-1 font-display text-2xl uppercase tracking-[-0.03em] text-white">
                  {myTeam.name}
                </h4>
                <p className="mt-2 text-sm text-white/55">
                  You can still browse other team profiles, but you will need to leave your current
                  team before joining another one.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(myTeam.invite_code);
                    setCodeCopied(true);
                    setTimeout(() => setCodeCopied(false), 1500);
                  }}
                  className="group/code rounded border border-white/10 bg-white/5 px-4 py-2 text-left transition-colors hover:border-white/20 hover:bg-white/[0.08]"
                  title="Click to copy invite code"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
                    Team code
                  </p>
                  <p className="mt-1 flex items-center gap-2 font-mono text-sm font-semibold text-white/90">
                    {myTeam.invite_code}
                    <span className={`transition-all ${codeCopied ? 'opacity-100' : 'opacity-0 group-hover/code:opacity-60'}`}>
                      {codeCopied ? (
                        <svg className="h-3.5 w-3.5 text-[#00ff88]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-3.5 w-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </span>
                  </p>
                </button>
                <div className="rounded border border-white/10 bg-white/5 px-4 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
                    Open slots
                  </p>
                  <p className="mt-1 font-mono text-sm text-white/85">
                    {Math.max(myTeam.max_size - myTeam.members.length, 0)} / {myTeam.max_size}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLeaveTeam}
                  disabled={isLeavingTeam}
                  className="button-heading rounded border border-red/30 bg-red/10 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-red transition-colors hover:bg-red/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLeavingTeam ? 'Leaving...' : 'Leave team'}
                </button>
              </div>
            </div>

            {myTeam.viewer_role === 'leader' && (
              <div className="mt-4 border-t border-[#00ff88]/15 pt-4">
                <JoinRequestManager
                  teamId={myTeam.id}
                  onRequestProcessed={() => void loadTeams()}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {!showCreateForm ? (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="button-heading group flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-white/12 bg-white/[0.02] p-8 transition-all hover:border-red/40 hover:bg-red/[0.04]"
              >
                <span className="mb-3 text-3xl text-white/20 transition-colors group-hover:text-red/60">
                  +
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/30 transition-colors group-hover:text-white/60">
                  Create Team
                </span>
                <span className="mt-2 text-center text-sm text-white/35">
                  Start a team, become the leader, and invite participants directly.
                </span>
              </button>
            ) : (
              <form
                onSubmit={handleCreateTeam}
                className="space-y-3 rounded-lg border border-red/20 bg-[#1a1a1a] p-5"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
                  New Team
                </div>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 font-body text-sm text-white placeholder:text-white/25 focus:border-red focus:outline-none"
                  placeholder="Team name"
                  autoFocus
                />
                <textarea
                  rows={2}
                  maxLength={200}
                  value={newDesc}
                  onChange={(event) => setNewDesc(event.target.value)}
                  className="w-full resize-none rounded border border-white/10 bg-black/40 px-3 py-2 font-body text-[13px] text-white placeholder:text-white/25 focus:border-red focus:outline-none"
                  placeholder="Brief description (optional)"
                />
                <div>
                  <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">
                    Tracks
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {TRACKS.map((track) => (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => toggleTrack(track.name)}
                        className={`rounded-sm border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] transition-colors ${
                          newTracks.includes(track.name)
                            ? track.bgClass
                            : 'border-white/10 bg-white/5 text-white/30 hover:text-white/50'
                        }`}
                      >
                        {track.id}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isCreating || !newName.trim()}
                    className="button-heading rounded border border-red/40 bg-red/15 px-4 py-1.5 text-[10px] uppercase tracking-[0.12em] text-red transition-colors hover:bg-red/25 disabled:opacity-40"
                  >
                    {isCreating ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setActionError(null);
                    }}
                    className="button-heading text-[10px] uppercase tracking-[0.12em] text-white/35 hover:text-white/60"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <form
              onSubmit={handleJoinByCode}
              className="flex min-h-[220px] flex-col justify-between rounded-lg border border-white/8 bg-[#1a1a1a] p-5"
            >
              <div>
                <h4 className="font-display text-xl uppercase tracking-[-0.03em] text-white">
                  Already have a team code?
                </h4>
                <p className="mt-2 text-sm text-white/45">
                  Ask a team leader for their code and join instantly without waiting for approval.
                </p>
              </div>

              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  maxLength={10}
                  placeholder="Enter team code"
                  className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm uppercase text-white placeholder:text-white/25 focus:border-red focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isJoiningByCode || joinCode.trim().length < 6}
                  className="button-heading w-full rounded border border-white/10 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isJoiningByCode ? 'Joining...' : 'Join team'}
                </button>
              </div>
            </form>
          </div>
        )}

        {actionError && (
          <div className="rounded border border-red/30 bg-red/10 px-4 py-3 text-sm text-red-200">
            {actionError}
          </div>
        )}

        {featuredTeam && (
          <button
            type="button"
            onClick={() => setSelectedTeam(featuredTeam.id)}
            className="button-heading group relative mb-6 w-full overflow-hidden rounded-lg border border-[#ffd700]/30 bg-gradient-to-br from-[#ffd700]/[0.06] via-[#1a1a1a] to-[#ffd700]/[0.03] p-6 text-left transition-all hover:border-[#ffd700]/50 hover:shadow-[0_0_30px_rgba(255,215,0,0.08)]"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#ffd700]/[0.04] blur-3xl" />
            <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-[#ffd700]/[0.03] blur-2xl" />

            <div className="relative z-10">
              <div className="mb-3 flex items-center gap-2">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#ffd700]">
                  ♠ Organizer's Team
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="line-clamp-1 font-display text-xl uppercase tracking-[-0.02em] text-white">
                    {featuredTeam.name}
                  </h4>
                  {myTeam?.id === featuredTeam.id && (
                    <span className="mt-1 inline-flex font-mono text-[9px] uppercase tracking-[0.12em] text-[#ffd700]/60">
                      Your team
                    </span>
                  )}
                </div>
                <span className={`shrink-0 rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] ${featuredTeam.is_full ? 'text-red' : 'text-[#00ff88]'}`}>
                  {featuredTeam.is_full ? 'Full' : 'Open'}
                </span>
              </div>

              {featuredTeam.description && (
                <p className="mt-2 line-clamp-2 font-body text-[13px] leading-relaxed text-white/50">
                  {featuredTeam.description}
                </p>
              )}

              {featuredTeam.tracks && featuredTeam.tracks.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {featuredTeam.tracks.map((trackName) => {
                    const track = TRACKS.find((item) => item.name === trackName);
                    if (!track) return null;
                    return (
                      <span key={track.id} className={`rounded-sm border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] ${track.bgClass}`}>
                        {track.id}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-[#ffd700]/10 pt-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-[#ffd700]/40">
                    {featuredTeam.member_count}/{featuredTeam.max_size}
                  </span>
                  <MemberAvatars team={featuredTeam} />
                </div>
              </div>
            </div>
          </button>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => setSelectedTeam(team.id)}
              className="button-heading group rounded-lg border border-white/8 bg-[#1a1a1a] p-5 text-left transition-all hover:border-white/15"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="line-clamp-1 font-display text-lg uppercase tracking-[-0.02em] text-white">
                    {team.name}
                  </h4>
                  {myTeam?.id === team.id && (
                    <span className="mt-2 inline-flex rounded border border-transparent bg-transparent px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white">
                      Your team
                    </span>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] ${
                    team.is_full
                      ? 'border-transparent bg-transparent text-red'
                      : 'border-transparent bg-transparent text-[#00ff88]'
                  }`}
                >
                  {team.is_full ? 'Full' : 'Open'}
                </span>
              </div>

              {team.description && (
                <p className="mt-2 line-clamp-2 font-body text-[13px] leading-relaxed text-white/40">
                  {team.description}
                </p>
              )}

              {team.tracks && team.tracks.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {team.tracks.map((trackName) => {
                    const track = TRACKS.find((item) => item.name === trackName);
                    if (!track) return null;

                    return (
                      <span
                        key={track.id}
                        className={`rounded-sm border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] ${track.bgClass}`}
                      >
                        {track.id}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-white/6 pt-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-white/35">
                    {team.member_count}/{team.max_size}
                  </span>
                  <MemberAvatars team={team} />
                </div>
              </div>
            </button>
          ))}
        </div>

        {teams.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-white/8 bg-[#1a1a1a] py-16 px-8 text-center">
            <CardSuitDivider size="md" className="mb-6" />

            <PokerChipGraphic size={100} color="red" className="mb-6" />

            <h3 className="mb-2 font-display text-3xl uppercase tracking-wide text-white">
              THE TABLE IS EMPTY
            </h3>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[#C9A84C]">
              // waiting_for_first_dealer
            </p>

            <p className="max-w-md font-body text-sm leading-relaxed text-white/40">
              No crews formed yet. Create the first team and become the house.
            </p>

            <TerminalPrompt prefix="$" text="deal_in" color="red" className="mt-6" />
          </div>
        )}
      </div>

      {selectedTeam && (
        <TeamDetailModal
          teamId={selectedTeam}
          onClose={() => setSelectedTeam(null)}
          onJoinRequestSent={() => {
            setSelectedTeam(null);
            void loadTeams();
          }}
        />
      )}
    </>
  );
}
