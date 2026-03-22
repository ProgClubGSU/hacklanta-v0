import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import TeamDetailModal from './TeamDetailModal';
import Icon from '@/components/ui/Icon';

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
          <p className="font-label text-sm uppercase tracking-widest text-outline">Loading teams...</p>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="py-12 text-center">
        <Icon name="group_off" className="mb-4 text-6xl text-on-surface/20" />
        <h3 className="mb-2 font-headline text-2xl tracking-wide text-white-pure">No Teams Available</h3>
        <p className="text-on-surface/60">Check back later or create your own team to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-headline text-xl tracking-wide text-white-pure">Browse Teams</h3>
            <p className="mt-1 font-label text-xs tracking-wider text-outline">
              {teams.length} team{teams.length !== 1 ? 's' : ''} available
            </p>
          </div>

          <button
            onClick={() => setShowAvailableOnly(!showAvailableOnly)}
            className={`flex items-center gap-2 rounded border px-4 py-2 font-label text-xs font-semibold uppercase tracking-wider transition-all ${
              showAvailableOnly
                ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
                : 'border-outline-variant/40 bg-surface-container-high/50 text-on-surface/70 hover:border-outline-variant/60 hover:bg-surface-container-high'
            }`}
          >
            <Icon name="tune" />
            {showAvailableOnly ? 'Show All' : 'Available Only'}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team.id)}
              className="glass-effect group relative overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container/80 p-5 text-left transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 bg-[radial-gradient(circle,rgba(255,179,177,0.1)_0%,transparent_60%)] opacity-0 transition-opacity group-hover:opacity-100"></div>

              <div className="relative z-10 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="line-clamp-1 font-headline text-xl tracking-wide text-white-pure">{team.name}</h4>
                  {team.is_full ? (
                    <span className="flex shrink-0 items-center gap-1 rounded border border-outline/40 bg-surface-container-highest/50 px-2 py-0.5 font-label text-[10px] font-bold uppercase tracking-wider text-outline">
                      <Icon name="lock" className="text-xs" />
                      Full
                    </span>
                  ) : (
                    <span className="flex shrink-0 items-center gap-1 rounded border border-secondary-fixed/40 bg-secondary-container/10 px-2 py-0.5 font-label text-[10px] font-bold uppercase tracking-wider text-secondary-fixed">
                      <Icon name="auto_awesome" className="text-xs" fill />
                      Open
                    </span>
                  )}
                </div>

                {team.description && (
                  <p className="line-clamp-2 text-sm leading-relaxed text-on-surface/70">{team.description}</p>
                )}

                <div className="flex items-center justify-between border-t border-outline-variant/20 pt-3">
                  <div className="flex items-center gap-2">
                    <Icon name="group" className="text-primary" />
                    <span className="font-mono text-sm text-on-surface/80">
                      {team.member_count}/{team.max_size}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 font-label text-xs uppercase tracking-wider text-primary transition-all group-hover:gap-2">
                    {team.is_full ? 'View' : 'Join'}
                    <Icon name="arrow_forward" className="text-sm" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
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
