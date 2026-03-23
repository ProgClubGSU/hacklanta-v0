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

function SocialIcon({ label }: { label: string }) {
  if (label === 'GitHub') {
    return (
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </svg>
  );
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
            const hasBio = Boolean(player.bio?.trim());

            return (
              <button
                key={player.id}
                type="button"
                onClick={() => setSelectedParticipant(player)}
                className={`button-heading rounded-lg border p-5 text-left transition-colors hover:border-white/20 ${
                  hasBio
                    ? 'border-white/[0.12] bg-[#1f1f1f]'
                    : 'border-white/[0.08] bg-[#1a1a1a]'
                }`}
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
                        <span className="rounded border border-transparent bg-transparent px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white">
                          You
                        </span>
                      )}
                    </div>

                    <p className={`mt-1 line-clamp-2 text-sm leading-relaxed ${
                      hasBio ? 'text-white/70' : 'text-white/40 italic'
                    }`}>
                      {player.bio?.trim() || 'Open this participant profile to learn more.'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/6 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {player.current_team ? (
                      <span className="rounded px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white">
                        {player.current_team.name}
                      </span>
                    ) : player.looking_for_team ? (
                      <span className="rounded px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white">
                        Looking for team
                      </span>
                    ) : null}
                    {!player.has_profile && (
                      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white">
                        No profile yet
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-white/35">
                    {player.linkedin_url && (
                      <a
                        href={player.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="transition-colors hover:text-white"
                        title="LinkedIn"
                        aria-label="LinkedIn"
                      >
                        <SocialIcon label="LinkedIn" />
                      </a>
                    )}
                    {player.github_url && (
                      <a
                        href={player.github_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="transition-colors hover:text-white"
                        title="GitHub"
                        aria-label="GitHub"
                      >
                        <SocialIcon label="GitHub" />
                      </a>
                    )}
                    {player.portfolio_url && (
                      <a
                        href={player.portfolio_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="transition-colors hover:text-white"
                        title="Portfolio"
                        aria-label="Portfolio"
                      >
                        <SocialIcon label="Portfolio" />
                      </a>
                    )}
                  </div>
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
