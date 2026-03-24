import { useEffect, useState } from 'react';

import ParticipantDetailModal from './ParticipantDetailModal';
import LoadingHand from './casino/LoadingHand';
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

function normalizeHref(value: string | null) {
  if (!value?.trim()) return '';
  if (/^http:\/\//i.test(value)) return value.replace(/^http:/i, 'https:');
  return /^https:\/\//i.test(value) ? value : `https://${value}`;
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

const PAGE_SIZE = 24;
const FEATURED_USER_ID = '92961dc0-ab26-41f4-8a94-110dc0796169'; // Joey Zhang

export default function UserGrid() {
  const [players, setPlayers] = useState<ParticipantCard[]>([]);
  const [featuredPlayer, setFeaturedPlayer] = useState<ParticipantCard | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
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
  }, [page]);

  async function loadPlayers() {
    try {
      setIsLoading(true);

      const [result, currentUserId, myTeam] = await Promise.all([
        api.listParticipantDirectory({ offset: page * PAGE_SIZE, limit: PAGE_SIZE }),
        api.getCurrentUserId(),
        api.getMyTeam(),
      ]);

      const allPlayers = result.data as ParticipantCard[];
      const featured = allPlayers.find((p) => p.user_id === FEATURED_USER_ID) ?? null;
      setFeaturedPlayer(featured);
      setPlayers(allPlayers.filter((p) => p.user_id !== FEATURED_USER_ID));
      setTotal(result.meta.total);
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
        <LoadingHand label="Finding participants..." />
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
          <span className="font-mono text-[11px] text-white/40">({total})</span>
        </div>

        {featuredPlayer && (
          <button
            type="button"
            onClick={() => setSelectedParticipant(featuredPlayer)}
            className="button-heading relative mb-6 w-full overflow-hidden rounded-lg border border-[#ffd700]/30 bg-gradient-to-br from-[#ffd700]/[0.06] via-[#1f1f1f] to-[#ffd700]/[0.03] p-6 text-left transition-all hover:border-[#ffd700]/50 hover:shadow-[0_0_30px_rgba(255,215,0,0.08)]"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#ffd700]/[0.04] blur-3xl" />
            <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-[#ffd700]/[0.03] blur-2xl" />

            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffd700]">
                  ♠ Organizer
                </span>
              </div>

              <div className="flex items-start gap-5">
                {featuredPlayer.avatar_url ? (
                  <img
                    src={featuredPlayer.avatar_url}
                    alt={featuredPlayer.display_name}
                    className="h-20 w-20 shrink-0 rounded-full border border-[#ffd700]/20 object-cover shadow-[0_0_12px_rgba(255,215,0,0.1)]"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[#ffd700]/20 bg-[#ffd700]/[0.08]">
                    <span className="font-mono text-lg font-semibold text-[#ffd700]/70">
                      {getInitials(featuredPlayer.display_name)}
                    </span>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="font-display text-2xl uppercase tracking-[-0.02em] text-white sm:text-3xl">
                    {featuredPlayer.display_name}
                  </p>
                  {featuredPlayer.bio && (
                    <p className="mt-2 line-clamp-2 font-body text-sm leading-relaxed text-white/60">
                      {featuredPlayer.bio}
                    </p>
                  )}
                </div>
              </div>

              {featuredPlayer.current_team && (
                <div className="mt-3">
                  <span className="rounded px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em]">
                    <span className="text-white/70">Team </span>
                    <span className="text-[#ffd700]">{featuredPlayer.current_team.name}</span>
                  </span>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3 border-t border-[#ffd700]/10 pt-5">
                <a
                  href="https://www.linkedin.com/in/joeyzhangdev/"
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 rounded-md border border-[#ffd700]/30 bg-[#ffd700]/[0.08] px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.15em] text-[#ffd700] transition-all hover:border-[#ffd700]/60 hover:bg-[#ffd700]/[0.15] hover:shadow-[0_0_20px_rgba(255,215,0,0.15)]"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </a>
                <a
                  href="https://www.instagram.com/joeysixfive/"
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 rounded-md border border-[#ff3366]/30 bg-[#ff3366]/[0.08] px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.15em] text-[#ff3366] transition-all hover:border-[#ff3366]/60 hover:bg-[#ff3366]/[0.15] hover:shadow-[0_0_20px_rgba(255,51,102,0.15)]"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  Instagram
                </a>
              </div>
            </div>
          </button>
        )}

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

                    <p className={`mt-1 line-clamp-2 font-body not-italic text-sm leading-relaxed ${
                      hasBio ? 'text-white/70' : 'text-white/40 italic'
                    }`}>
                      {player.bio?.trim() || 'Open this participant profile to learn more.'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/6 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {player.current_team ? (
                      <span className="rounded px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em]">
                        <span className="text-white">Team </span>
                        <span className="text-[#C41E3A]">{player.current_team.name}</span>
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
                        href={normalizeHref(player.linkedin_url)}
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
                        href={normalizeHref(player.github_url)}
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
                        href={normalizeHref(player.portfolio_url)}
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

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded border border-white/10 bg-white/5 px-4 py-2 font-mono text-xs uppercase tracking-wider text-white/60 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              &larr; Prev
            </button>
            <span className="font-mono text-xs text-white/40">
              Page {page + 1} of {Math.ceil(total / PAGE_SIZE)}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * PAGE_SIZE >= total}
              className="rounded border border-white/10 bg-white/5 px-4 py-2 font-mono text-xs uppercase tracking-wider text-white/60 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next &rarr;
            </button>
          </div>
        )}
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
