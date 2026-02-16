import { useAuth } from '@clerk/astro/react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import type { PaginatedResponse } from '../../lib/api';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  max_size: number;
  created_by: string | null;
  created_at: string;
  members: TeamMember[];
}

interface TeamListItem {
  id: string;
  name: string;
  description: string | null;
  max_size: number;
  member_count: number;
  created_at: string;
}

export default function TeamFinder() {
  const { getToken } = useAuth();
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<TeamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');

  const [showJoin, setShowJoin] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      const token = await getToken();

      try {
        const team = await apiFetch<Team>('/api/v1/teams/me', {}, token);
        setMyTeam(team);
      } catch {
        setMyTeam(null);
      }

      const result = await apiFetch<PaginatedResponse<TeamListItem>>(
        '/api/v1/teams?page_size=50',
        {},
        token,
      );
      setTeams(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const team = await apiFetch<Team>(
        '/api/v1/teams',
        { method: 'POST', body: JSON.stringify({ name: teamName, description: teamDesc || null }) },
        token,
      );
      setMyTeam(team);
      setShowCreate(false);
      setTeamName('');
      setTeamDesc('');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const team = await apiFetch<Team>(
        '/api/v1/teams/join',
        { method: 'POST', body: JSON.stringify({ invite_code: inviteCode }) },
        token,
      );
      setMyTeam(team);
      setShowJoin(false);
      setInviteCode('');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join team');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!myTeam) return;
    setActionLoading(true);
    setError(null);
    try {
      const token = await getToken();
      await apiFetch(`/api/v1/teams/${myTeam.id}/members/me`, { method: 'DELETE' }, token);
      setMyTeam(null);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave team');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-8 text-center font-mono text-sm text-text-muted">// loading teams...</div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {error && (
        <div className="border border-suit-red/30 bg-suit-red/10 px-4 py-3 font-mono text-sm text-suit-red">
          {error}
        </div>
      )}

      {myTeam ? (
        <div className="border border-base-border bg-base-card shadow-[0_0_15px_rgba(232,180,79,0.15)]">
          <div className="border-b border-base-border bg-base-dark px-6 py-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs tracking-widest text-text-muted">
                YOUR TABLE // TEAM
              </span>
              <span className="font-mono text-xs text-gold">
                {myTeam.members.length}/{myTeam.max_size} SEATS
              </span>
            </div>
          </div>

          <div className="p-6">
            <h3 className="font-display text-xl font-bold text-text-primary">{myTeam.name}</h3>
            {myTeam.description && (
              <p className="mt-1 font-mono text-sm text-text-muted">{myTeam.description}</p>
            )}

            <div className="mt-4 flex items-center gap-3 border border-dashed border-base-border bg-base-dark px-4 py-2">
              <span className="font-mono text-xs text-text-muted">INVITE CODE:</span>
              <code className="font-mono text-sm font-bold text-gold">{myTeam.invite_code}</code>
            </div>

            <div className="mt-4 space-y-2">
              <p className="font-mono text-xs tracking-wider text-text-muted">{'>'} MEMBERS</p>
              {myTeam.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between border-b border-base-border/50 py-2 font-mono text-sm"
                >
                  <span className="text-text-primary">{m.user_id.slice(0, 8)}...</span>
                  <span className={m.role === 'leader' ? 'text-gold' : 'text-text-muted'}>
                    {m.role.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleLeave}
              disabled={actionLoading}
              className="mt-4 w-full border border-suit-red/50 bg-suit-red/10 px-4 py-2 font-mono text-xs tracking-wider text-suit-red transition-colors hover:bg-suit-red/20 disabled:opacity-50"
            >
              {actionLoading ? '// LEAVING...' : '$ LEAVE_TABLE'}
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-base-border bg-base-card">
          <div className="border-b border-base-border bg-base-dark px-6 py-3">
            <span className="font-mono text-xs tracking-widest text-text-muted">
              NO TABLE // JOIN OR CREATE
            </span>
          </div>

          <div className="flex gap-3 p-6">
            <button
              onClick={() => {
                setShowCreate(true);
                setShowJoin(false);
              }}
              className="flex-1 border-2 border-gold bg-gold/10 px-4 py-3 font-mono text-sm font-bold tracking-wider text-gold transition-all hover:bg-gold/20 hover:shadow-[0_0_15px_rgba(232,180,79,0.22)]"
            >
              $ CREATE_TEAM
            </button>
            <button
              onClick={() => {
                setShowJoin(true);
                setShowCreate(false);
              }}
              className="flex-1 border-2 border-gold bg-gold/10 px-4 py-3 font-mono text-sm font-bold tracking-wider text-gold transition-all hover:bg-gold/20 hover:shadow-[0_0_15px_rgba(198,149,63,0.22)]"
            >
              $ JOIN_TEAM
            </button>
          </div>

          {showCreate && (
            <form onSubmit={handleCreate} className="border-t border-base-border p-6">
              <p className="mb-4 font-mono text-xs tracking-wider text-gold">
                {'>'} NEW_TEAM
              </p>
              <div className="space-y-3">
                <input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  placeholder="Team name"
                  className="w-full border border-base-border bg-base-dark px-3 py-2 font-mono text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-gold"
                />
                <textarea
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  placeholder="Description (skills wanted, project ideas...)"
                  rows={3}
                  className="w-full border border-base-border bg-base-dark px-3 py-2 font-mono text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-gold"
                />
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full border border-gold bg-gold/10 px-4 py-2 font-mono text-sm tracking-wider text-gold transition-colors hover:bg-gold/20 disabled:opacity-50"
                >
                  {actionLoading ? '// CREATING...' : 'CONFIRM'}
                </button>
              </div>
            </form>
          )}

          {showJoin && (
            <form onSubmit={handleJoin} className="border-t border-base-border p-6">
              <p className="mb-4 font-mono text-xs tracking-wider text-gold">
                {'>'} JOIN_WITH_CODE
              </p>
              <div className="flex gap-3">
                <input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                  placeholder="Enter invite code"
                  className="flex-1 border border-base-border bg-base-dark px-3 py-2 font-mono text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-gold"
                />
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="border border-gold bg-gold/10 px-6 py-2 font-mono text-sm tracking-wider text-gold transition-colors hover:bg-gold/20 disabled:opacity-50"
                >
                  {actionLoading ? '...' : 'JOIN'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Browse Teams */}
      <div className="border border-base-border bg-base-card">
        <div className="border-b border-base-border bg-base-dark px-6 py-3">
          <span className="font-mono text-xs tracking-widest text-text-muted">
            OPEN TABLES // {teams.length} TEAMS
          </span>
        </div>

        {teams.length === 0 ? (
          <div className="p-6 text-center font-mono text-sm text-text-muted">
            // no teams yet — be the first to create one
          </div>
        ) : (
          <div className="divide-y divide-base-border">
            {teams.map((team) => (
              <div key={team.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-display text-sm font-bold text-text-primary">{team.name}</p>
                  {team.description && (
                    <p className="mt-0.5 font-mono text-xs text-text-muted">
                      {team.description.length > 80
                        ? team.description.slice(0, 80) + '...'
                        : team.description}
                    </p>
                  )}
                </div>
                <span
                  className={`font-mono text-xs ${
                    team.member_count >= team.max_size ? 'text-suit-red' : 'text-gold'
                  }`}
                >
                  {team.member_count}/{team.max_size}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
