import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { TRACKS } from '@/lib/tracks';
import TeamDetailModal from './TeamDetailModal';

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
  created_at: string;
}

const SUIT_SYMBOLS = ['♠', '♦', '♣', '♥'];

function MemberAvatars({ team }: { team: Team }) {
  const members = team.team_members ?? [];
  const openSlots = Math.max(team.max_size - members.length, 0);

  return (
    <div className="flex items-center -space-x-1.5">
      {members.map((m, i) => {
        const user = m.users;
        const initials = `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase() || '?';
        return user?.avatar_url ? (
          <img
            key={m.id}
            src={user.avatar_url}
            alt=""
            className="h-7 w-7 rounded-full border-2 border-[#1a1a1a] object-cover"
          />
        ) : (
          <div
            key={m.id}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#1a1a1a] bg-white/10 font-mono text-[9px] text-white/50"
          >
            {initials}
          </div>
        );
      })}
      {Array.from({ length: openSlots }).map((_, i) => (
        <div
          key={`slot-${i}`}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-white/15 text-[11px] text-white/15"
        >
          {SUIT_SYMBOLS[i % SUIT_SYMBOLS.length]}
        </div>
      ))}
    </div>
  );
}

export default function TeamGrid() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  // Create team form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTracks, setNewTracks] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      const result = await api.listTeams({ has_openings: showAvailableOnly || undefined });
      setTeams(result.data ?? []);
    } catch (error) {
      console.error('Failed to load teams:', error);
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, [showAvailableOnly]);

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      await api.createTeam({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        tracks: newTracks.length > 0 ? newTracks : undefined,
      });
      setNewName('');
      setNewDesc('');
      setNewTracks([]);
      setShowCreateForm(false);
      loadTeams();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setIsCreating(false);
    }
  }

  function toggleTrack(trackName: string) {
    setNewTracks(prev =>
      prev.includes(trackName)
        ? prev.filter(t => t !== trackName)
        : [...prev, trackName]
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-red"></div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-2xl uppercase tracking-[-0.03em] text-white">Teams</h3>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-white/35">
              {teams.length} team{teams.length !== 1 ? 's' : ''} formed
            </p>
          </div>

          <button
            onClick={() => setShowAvailableOnly(!showAvailableOnly)}
            className={`rounded px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-all ${
              showAvailableOnly
                ? 'bg-red/15 text-red border border-red/30'
                : 'bg-white/5 text-white/40 border border-white/10 hover:text-white/60'
            }`}
          >
            {showAvailableOnly ? 'Showing open' : 'Show open only'}
          </button>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Create Team Card — always first */}
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="group flex flex-col items-center justify-center rounded-lg border border-dashed border-white/12 bg-white/[0.02] p-8 transition-all hover:border-red/40 hover:bg-red/[0.04]"
            >
              <span className="mb-3 text-3xl text-white/20 transition-colors group-hover:text-red/60">+</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/30 transition-colors group-hover:text-white/60">
                Create Team
              </span>
            </button>
          ) : (
            <form
              onSubmit={handleCreateTeam}
              className="rounded-lg border border-red/20 bg-[#1a1a1a] p-5 space-y-3"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">New Team</div>
              <input
                type="text"
                required
                maxLength={50}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 font-body text-sm text-white placeholder:text-white/25 focus:border-red focus:outline-none"
                placeholder="Team name"
                autoFocus
              />
              <textarea
                rows={2}
                maxLength={200}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full resize-none rounded border border-white/10 bg-black/40 px-3 py-2 font-body text-[13px] text-white placeholder:text-white/25 focus:border-red focus:outline-none"
                placeholder="Brief description (optional)"
              />
              {/* Track selector */}
              <div>
                <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">Tracks</div>
                <div className="flex flex-wrap gap-1.5">
                  {TRACKS.map(track => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => toggleTrack(track.name)}
                      className={`rounded-sm px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] border transition-colors ${
                        newTracks.includes(track.name)
                          ? track.bgClass
                          : 'bg-white/5 text-white/30 border-white/10 hover:text-white/50'
                      }`}
                    >
                      {track.id}
                    </button>
                  ))}
                </div>
              </div>
              {createError && (
                <p className="text-[12px] text-red-bright">{createError}</p>
              )}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isCreating || !newName.trim()}
                  className="rounded border border-red/40 bg-red/15 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-red transition-colors hover:bg-red/25 disabled:opacity-40"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setCreateError(null); }}
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/35 hover:text-white/60"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Team cards */}
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team.id)}
              className="group rounded-lg border border-white/8 bg-[#1a1a1a] p-5 text-left transition-all hover:border-white/15"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="line-clamp-1 font-display text-lg uppercase tracking-[-0.02em] text-white">{team.name}</h4>
                <span className={`shrink-0 rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] ${
                  team.is_full
                    ? 'bg-white/5 text-white/30'
                    : 'bg-[#00ff88]/10 text-[#00ff88]'
                }`}>
                  {team.is_full ? 'Full' : 'Open'}
                </span>
              </div>

              {team.description && (
                <p className="mt-2 line-clamp-2 font-body text-[13px] leading-relaxed text-white/40">{team.description}</p>
              )}

              {team.tracks && team.tracks.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {team.tracks.map((trackName) => {
                    const track = TRACKS.find((t) => t.name === trackName);
                    if (!track) return null;
                    return (
                      <span
                        key={track.id}
                        className={`font-mono text-[8px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-sm border ${track.bgClass}`}
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
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/25 transition-colors group-hover:text-red">
                  View &rarr;
                </span>
              </div>
            </button>
          ))}
        </div>

        {teams.length === 0 && (
          <p className="py-8 text-center font-body text-sm text-white/30">
            No teams yet. Be the first to create one.
          </p>
        )}
      </div>

      {selectedTeam && (
        <TeamDetailModal
          teamId={selectedTeam}
          onClose={() => setSelectedTeam(null)}
          onJoinRequestSent={() => {
            setSelectedTeam(null);
            loadTeams();
          }}
        />
      )}
    </>
  );
}
