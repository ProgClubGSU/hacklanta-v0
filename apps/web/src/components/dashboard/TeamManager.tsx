import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/astro/react';
import { api } from '@/lib/api';
import JoinRequestManager from './JoinRequestManager';

export default function TeamManager() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestsProcessed, setRequestsProcessed] = useState(0);

  // Forms
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadTeam();
  }, []);

  async function loadTeam() {
    try {
      setLoading(true);
      const myTeam = await api.getMyTeam();
      setTeam(myTeam);
    } catch (err: any) {
      if (err.status !== 404) {
        setError('Failed to load team data.');
      } else {
        setTeam(null);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      await api.createTeam({ name: createName, description: createDesc || null });
      await loadTeam();
    } catch (err: any) {
      setError(err.message || 'Failed to create team.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      await api.joinTeam({ invite_code: joinCode });
      await loadTeam();
    } catch (err: any) {
      setError(err.message || 'Failed to join team.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this team?')) return;
    setActionLoading(true);
    setError(null);
    try {
      await api.leaveTeam();
      setTeam(null);
    } catch (err: any) {
      setError(err.message || 'Failed to leave team.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-red/20 border-t-red"></div>
          <p className="font-mono text-sm uppercase tracking-widest text-gray">Loading team status...</p>
        </div>
      </div>
    );
  }

  if (team) {
    const isCurrentUserLeader = team.members.some(
      (m: any) => m.role === 'leader' && m.user_id === userId
    );

    return (
      <div className="space-y-6">
        {/* Team Header */}
        <div className="relative overflow-hidden rounded-lg border border-red/40 bg-black-card/80 p-6 backdrop-blur-sm">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -top-24 right-0 h-48 w-full bg-[radial-gradient(circle_at_100%_0%,rgba(196,30,58,0.08)_0%,transparent_60%)]" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-display text-3xl tracking-wide text-white-pure">
                  {team.name}
                </h3>
                {isCurrentUserLeader && (
                  <span className="rounded border border-gold/40 bg-gold/10 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-gold">
                    Leader
                  </span>
                )}
              </div>
              {team.description && (
                <p className="text-sm leading-relaxed text-white/70">{team.description}</p>
              )}
            </div>

            {/* Invite Code Card */}
            <div className="shrink-0 rounded-lg border border-gold/40 bg-gold/5 p-4 text-center backdrop-blur-sm">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-gold/80 mb-2">
                Invite Code
              </div>
              <div
                className="font-mono text-xl font-bold text-gold cursor-copy hover:text-gold-bright transition-colors select-all"
                title="Click to copy"
                onClick={() => navigator.clipboard.writeText(team.invite_code)}
              >
                {team.invite_code}
              </div>
            </div>
          </div>
        </div>

        {/* Members Section */}
        <div className="relative overflow-hidden rounded-lg border border-red/40 bg-black-card/80 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-display text-xl tracking-wide text-white-pure">
              Team Members
            </h4>
            <div className="font-mono text-xs uppercase tracking-wider text-red">
              {team.members.length}/{team.max_size}
            </div>
          </div>

          <div className="space-y-2">
            {team.members.map((member: any) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded border border-red/20 bg-red/5 p-3"
              >
                <img
                  src={member.avatar_url || 'https://via.placeholder.com/40'}
                  alt={member.first_name || 'User'}
                  className="h-10 w-10 rounded-full border-2 border-red/30"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white truncate">
                      {member.first_name} {member.last_name}
                    </p>
                    {member.role === 'leader' && (
                      <span className="shrink-0 rounded bg-gold/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-gold">
                        Leader
                      </span>
                    )}
                  </div>
                  {member.email && (
                    <p className="font-mono text-xs text-gray truncate">{member.email}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Join Requests (for leaders) */}
        {isCurrentUserLeader && (
          <div className="relative overflow-hidden rounded-lg border border-gold/40 bg-black-card/80 p-6 backdrop-blur-sm">
            <h4 className="mb-4 font-display text-xl tracking-wide text-white-pure">
              Join Requests
            </h4>
            <JoinRequestManager
              teamId={team.id}
              onRequestProcessed={() => {
                setRequestsProcessed((prev) => prev + 1);
                loadTeam();
              }}
            />
          </div>
        )}

        {error && (
          <div className="rounded border border-red/30 bg-red/10 p-3 text-sm text-red-bright">
            {error}
          </div>
        )}

        {/* Leave Team */}
        <div className="flex justify-end">
          <button
            onClick={handleLeave}
            disabled={actionLoading}
            className="border border-red/40 bg-red/10 px-6 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-red-bright transition-all hover:border-red/70 hover:bg-red/20 hover:shadow-[0_0_20px_rgba(196,30,58,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? 'Leaving...' : 'Leave Team'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Create Team Form */}
      <div className="relative overflow-hidden rounded-lg border border-red/40 bg-black-card/80 p-6 backdrop-blur-sm">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-24 left-0 h-48 w-full bg-[radial-gradient(circle_at_0%_0%,rgba(196,30,58,0.08)_0%,transparent_60%)]" />

        <div className="relative z-10">
          <h3 className="mb-4 font-display text-xl tracking-wide text-white-pure">
            Create a New Team
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-red/80">
                Team Name <span className="text-red-bright">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Code Wizards"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full rounded border border-red/30 bg-black/40 px-4 py-2 text-white placeholder-gray transition-colors focus:border-red focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-red/80">
                Description
              </label>
              <textarea
                placeholder="What will your team build?"
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                className="w-full resize-none rounded border border-red/30 bg-black/40 px-4 py-2 text-white placeholder-gray transition-colors focus:border-red focus:outline-none"
                rows={4}
              />
            </div>
            <button
              type="submit"
              disabled={actionLoading || !createName.trim()}
              className="w-full border border-red/40 bg-red/10 px-6 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-red-bright transition-all hover:border-red/70 hover:bg-red/20 hover:shadow-[0_0_20px_rgba(196,30,58,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Creating...' : 'Create Team'}
            </button>
          </form>
        </div>
      </div>

      {/* Join Team Form */}
      <div className="relative overflow-hidden rounded-lg border border-red/40 bg-black-card/80 p-6 backdrop-blur-sm">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-24 right-0 h-48 w-full bg-[radial-gradient(circle_at_100%_0%,rgba(196,30,58,0.08)_0%,transparent_60%)]" />

        <div className="relative z-10">
          <h3 className="mb-4 font-display text-xl tracking-wide text-white-pure">
            Join Existing Team
          </h3>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-red/80">
                Invite Code <span className="text-red-bright">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="6-Character Code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={10}
                className="w-full rounded border border-red/30 bg-black/40 px-4 py-2 font-mono text-white placeholder-gray transition-colors focus:border-red focus:outline-none uppercase"
              />
            </div>
            <p className="text-xs text-gray">
              Ask a team leader for their 6-character invite code to join them.
            </p>
            <button
              type="submit"
              disabled={actionLoading || joinCode.length < 5}
              className="w-full border border-red/40 bg-red/10 px-6 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-red-bright transition-all hover:border-red/70 hover:bg-red/20 hover:shadow-[0_0_20px_rgba(196,30,58,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Joining...' : 'Join Team'}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="col-span-full rounded border border-red/30 bg-red/10 p-3 text-sm text-red-bright">
          {error}
        </div>
      )}
    </div>
  );
}
