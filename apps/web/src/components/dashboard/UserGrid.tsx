import { useEffect, useState } from 'react';

import ParticipantDetailModal from './ParticipantDetailModal';
import { api } from '../../lib/api';
import { PROFILE_CHANGED_EVENT, TEAM_CHANGED_EVENT } from '@/lib/dashboard-events';

interface ParticipantTeamSummary {
  id: string;
  name: string;
  role: string;
}

interface ParticipantCard {
  id: string;
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  display_name: string;
  bio: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  discord_username: string | null;
  looking_for_team: boolean;
  has_profile: boolean;
  current_team: ParticipantTeamSummary | null;
}

interface ViewerTeam {
  id: string;
  name: string;
  max_size: number;
  members: Array<{
    user_id: string;
    role: string;
  }>;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function UserGrid() {
  const [players, setPlayers] = useState<ParticipantCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const [viewerTeam, setViewerTeam] = useState<ViewerTeam | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantCard | null>(null);

  useEffect(() => {
    void loadPlayers();

    const handleRefresh = () => {
      void loadPlayers();
    };

    window.addEventListener(PROFILE_CHANGED_EVENT, handleRefresh);
    window.addEventListener(TEAM_CHANGED_EVENT, handleRefresh);

    return () => {
      window.removeEventListener(PROFILE_CHANGED_EVENT, handleRefresh);
      window.removeEventListener(TEAM_CHANGED_EVENT, handleRefresh);
    };
  }, []);

  async function loadPlayers() {
    try {
      setIsLoading(true);

      const [directory, currentUserId, myTeam] = await Promise.all([
        api.listParticipantDirectory(),
        api.getCurrentUserId(),
        api.getMyTeam(),
      ]);

      const sortedDirectory = (directory as ParticipantCard[]).sort((left, right) => {
        if (left.user_id === currentUserId) return -1;
        if (right.user_id === currentUserId) return 1;
        if (left.looking_for_team !== right.looking_for_team) {
          return left.looking_for_team ? -1 : 1;
        }
        if (left.has_profile !== right.has_profile) {
          return left.has_profile ? -1 : 1;
        }
        return left.display_name.localeCompare(right.display_name);
      });

      setPlayers(sortedDirectory);
      setViewerUserId(currentUserId);
      setViewerTeam(
        myTeam
          ? {
              id: myTeam.id,
              name: myTeam.name,
              max_size: myTeam.max_size,
              members: myTeam.members.map((member: { user_id: string; role: string }) => ({
                user_id: member.user_id,
                role: member.role,
              })),
            }
          : null,
      );
    } catch (error) {
      console.error('Failed to load players:', error);
      setPlayers([]);
      setViewerTeam(null);
      setViewerUserId(null);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-red/20 border-t-red"></div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
            Loading participants...
          </p>
        </div>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="py-12 text-center">
        <h3 className="mb-2 font-display text-2xl text-white">No Participants Yet</h3>
        <p className="font-body text-sm text-white/40">
          No participant profiles are available yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-baseline gap-3">
          <h3 className="font-display text-2xl uppercase text-white">Participants</h3>
          <span className="font-mono text-[11px] text-white/40">({players.length})</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => {
            const isCurrentUser = player.user_id === viewerUserId;
            const statusLabel = player.current_team
              ? `On ${player.current_team.name}`
              : player.looking_for_team
                ? 'Looking for team'
                : 'Open profile';

            return (
              <button
                key={player.id}
                type="button"
                onClick={() => setSelectedParticipant(player)}
                className="rounded-lg border border-white/[0.08] bg-[#1a1a1a] p-5 text-left transition-colors hover:border-white/15"
              >
                <div className="flex items-start gap-3">
                  {player.avatar_url ? (
                    <img
                      src={player.avatar_url}
                      alt={player.display_name}
                      className="h-11 w-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.08]">
                      <span className="font-mono text-xs font-semibold text-white/50">
                        {getInitials(player.display_name)}
                      </span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-body text-sm font-semibold text-white">
                        {player.display_name}
                      </p>
                      {isCurrentUser && (
                        <span className="rounded border border-red/30 bg-red/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-red">
                          You
                        </span>
                      )}
                    </div>

                    <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-white/45">
                      {player.bio?.trim() || 'Open this participant profile to learn more.'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] ${
                        player.current_team
                          ? 'bg-white/5 text-white/35'
                          : player.looking_for_team
                            ? 'bg-[#00ff88]/10 text-[#00ff88]'
                            : 'bg-white/5 text-white/35'
                      }`}
                    >
                      {statusLabel}
                    </span>
                    {!player.has_profile && (
                      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-gold/80">
                        No profile yet
                      </span>
                    )}
                  </div>

                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/25">
                    View
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedParticipant && (
        <ParticipantDetailModal
          participant={selectedParticipant}
          viewerTeam={viewerTeam}
          viewerUserId={viewerUserId}
          onClose={() => setSelectedParticipant(null)}
          onInvitationSent={() => {
            void loadPlayers();
          }}
        />
      )}
    </>
  );
}
