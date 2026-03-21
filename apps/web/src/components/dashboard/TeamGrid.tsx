import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import TeamDetailModal from './TeamDetailModal';

interface Team {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
  max_size: number;
  is_full: boolean;
  is_looking_for_members: boolean;
  created_at: string;
}

export default function TeamGrid() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      const result = await api.listTeams({ has_openings: showAvailableOnly || undefined });
      setTeams(result.data);
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, [showAvailableOnly]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-red/20 border-t-red"></div>
          <p className="font-mono text-sm uppercase tracking-widest text-gray">Loading teams...</p>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4 text-6xl">⚡</div>
        <h3 className="mb-2 font-display text-2xl tracking-wide text-white-pure">No Teams Yet</h3>
        <p className="text-gray">Be the first to create a team!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Filter Toggle */}
        <div className="flex items-center justify-between border-b border-red/20 pb-4">
          <div>
            <h3 className="font-display text-xl tracking-wide text-white-pure">
              Browse Teams
            </h3>
            <p className="mt-1 font-mono text-xs tracking-wider text-gray">
              {teams.length} team{teams.length !== 1 ? 's' : ''} available
            </p>
          </div>

          <button
            onClick={() => setShowAvailableOnly(!showAvailableOnly)}
            className={`
              flex items-center gap-2 rounded border px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition-all
              ${
                showAvailableOnly
                  ? 'border-red/40 bg-red/10 text-red-bright hover:bg-red/20'
                  : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40 hover:bg-white/10'
              }
            `}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {showAvailableOnly ? 'Show All' : 'Available Only'}
          </button>
        </div>

        {/* Team Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team.id)}
              className="group relative overflow-hidden rounded-lg border border-red/40 bg-black-card/80 p-5 text-left backdrop-blur-sm transition-all duration-300 hover:border-red/70 hover:shadow-[0_0_20px_rgba(196,30,58,0.15)]"
            >
              {/* Card suit decoration */}
              <div className="pointer-events-none absolute right-3 top-3 select-none text-4xl text-red/10 transition-all group-hover:text-red/20" aria-hidden="true">
                ♠
              </div>

              <div className="relative z-10">
                <div className="mb-3 flex items-start justify-between">
                  <h4 className="font-display text-xl tracking-wide text-white-pure line-clamp-1">
                    {team.name}
                  </h4>
                  {team.is_full ? (
                    <span className="shrink-0 rounded border border-gray/40 bg-gray/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-gray">
                      Full
                    </span>
                  ) : (
                    <span className="shrink-0 rounded border border-green-500/40 bg-green-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-green-500">
                      Open
                    </span>
                  )}
                </div>

                {team.description && (
                  <p className="mb-4 text-sm leading-relaxed text-white/70 line-clamp-2">
                    {team.description}
                  </p>
                )}

                <div className="flex items-center justify-between border-t border-red/20 pt-3">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-red-bright" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    <span className="font-mono text-sm text-white/80">
                      {team.member_count}/{team.max_size}
                    </span>
                  </div>

                  <div className="font-mono text-xs uppercase tracking-wider text-red transition-all group-hover:text-red-bright">
                    View →
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Team Detail Modal */}
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
