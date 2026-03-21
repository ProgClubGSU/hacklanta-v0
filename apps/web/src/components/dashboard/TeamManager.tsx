import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/astro/react';
import { api } from '@/lib/api';
import JoinRequestManager from './JoinRequestManager';
import Icon from '@/components/ui/Icon';

<<<<<<< HEAD
interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  max_size: number;
  members: TeamMember[];
}

export default function TeamManager() {
=======
interface TeamManagerProps {
  compactWhenNoTeam?: boolean;
  onBrowseTeams?: () => void;
}

export default function TeamManager({
  compactWhenNoTeam = false,
  onBrowseTeams,
}: TeamManagerProps) {
>>>>>>> 054f02c (dashboard)
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestsProcessed, setRequestsProcessed] = useState(0);

  // Forms
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  useEffect(() => {
    loadTeam();
  }, []);

  async function loadTeam() {
    try {
      setLoading(true);
<<<<<<< HEAD
      const myTeam = await api.getMyTeam();
      setTeam(myTeam);
    } catch (err: unknown) {
      if (err instanceof Error && (err as Error & { status?: number }).status !== 404) {
=======
      // TODO: Replace with real API call
      // const myTeam = await api.getMyTeam();
      // setTeam(myTeam);

      // Mock - user has no team yet
      setTeam(null);
    } catch (err: any) {
      if (err.status !== 404) {
>>>>>>> 054f02c (dashboard)
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
<<<<<<< HEAD
      await api.createTeam({ name: createName, description: createDesc || undefined });
      await loadTeam();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create team.');
=======
      // TODO: Replace with real API call
      // await api.createTeam({ name: createName, description: createDesc || null });

      // Mock success - simulate team creation
      await new Promise(resolve => setTimeout(resolve, 500));
      alert('Team creation will be available once the API is connected!');
      setCreateName('');
      setCreateDesc('');
      setShowQuickCreate(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create team.');
>>>>>>> 054f02c (dashboard)
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
<<<<<<< HEAD
      await api.joinTeam({ invite_code: joinCode });
      await loadTeam();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to join team.');
=======
      // TODO: Replace with real API call
      // await api.joinTeam({ invite_code: joinCode });

      // Mock success - simulate joining team
      await new Promise(resolve => setTimeout(resolve, 500));
      alert('Team joining will be available once the API is connected!');
      setJoinCode('');
    } catch (err: any) {
      setError(err.message || 'Failed to join team.');
>>>>>>> 054f02c (dashboard)
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to leave team.');
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
      (m: TeamMember) => m.role === 'leader' && m.user_id === userId
    );

    const totalSlots = team.max_size;
    const filledSlots = team.members.length;
    const emptySlots = Math.max(0, totalSlots - filledSlots);

    return (
      <div className="space-y-6">
        {/* Team Header */}
        <div className="glass-effect overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container/80 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-headline text-3xl tracking-wide text-white-pure">
                  {team.name}
                </h2>
                {isCurrentUserLeader && (
                  <span className="rounded border border-secondary-container/40 bg-secondary-container/10 px-2 py-0.5 font-label text-xs font-bold uppercase tracking-wider text-secondary-fixed">
                    Lead
                  </span>
                )}
              </div>
              {team.description && (
                <p className="mt-2 text-sm leading-relaxed text-on-surface/70">{team.description}</p>
              )}
            </div>

            {/* Invite Code */}
            <div className="shrink-0 text-center">
              <Icon name="key" className="mb-2 text-2xl text-secondary-fixed" />
              <div className="font-label text-xs uppercase tracking-wider text-secondary/80">
                Invite Code
              </div>
              <div
                className="mt-1 cursor-copy select-all font-mono text-xl font-bold text-secondary-fixed transition-colors hover:text-secondary-fixed-dim"
                title="Click to copy"
                onClick={() => {
                  navigator.clipboard.writeText(team.invite_code);
                }}
              >
                {team.invite_code}
              </div>
            </div>
          </div>
        </div>


        {/* Team Roster - Slot System */}
        <div className="glass-effect overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container/80 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-headline text-xl tracking-wide text-white-pure">
              The Crew
            </h3>
            <div className="font-mono text-sm uppercase tracking-wider text-primary">
              {filledSlots} / {totalSlots} Slots
            </div>
          </div>

<<<<<<< HEAD
          <div className="space-y-2">
            {team.members.map((member: TeamMember) => (
=======
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Filled member slots */}
            {team.members.map((member: any) => (
>>>>>>> 054f02c (dashboard)
              <div
                key={member.id}
                className="flex items-center gap-3 rounded border border-outline-variant/20 bg-surface-container-high/50 p-3"
              >
                <img
                  src={member.avatar_url || 'https://via.placeholder.com/48'}
                  alt={member.first_name || 'User'}
                  className="h-12 w-12 rounded-full border-2 border-primary/30"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-white">
                      {member.first_name} {member.last_name}
                    </p>
                    {member.role === 'leader' && (
                      <span className="shrink-0 rounded bg-secondary-container/20 px-1.5 py-0.5 font-label text-[10px] font-bold uppercase text-secondary-fixed">
                        Lead
                      </span>
                    )}
                  </div>
                  {member.email && (
                    <p className="truncate font-mono text-xs text-on-surface/60">{member.email}</p>
                  )}
                </div>
                <button
                  className="shrink-0 rounded p-1.5 text-primary/60 transition-colors hover:bg-primary/10 hover:text-primary"
                  title="Message member"
                >
                  <Icon name="chat_bubble" className="text-xl" />
                </button>
              </div>
            ))}

            {/* Empty slots + Invite placeholder */}
            {emptySlots > 0 && (
              <button className="flex items-center gap-3 rounded border border-dashed border-outline-variant/40 bg-surface-container/30 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-outline-variant/40">
                  <Icon name="person_add" className="text-2xl text-on-surface/40" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-medium text-on-surface/70">Invite Member</p>
                  <p className="font-label text-xs text-on-surface/50">{emptySlots} {emptySlots === 1 ? 'slot' : 'slots'} available</p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Join Requests (for leaders) */}
        {isCurrentUserLeader && (
          <div className="glass-effect overflow-hidden rounded-lg border border-secondary-container/40 bg-surface-container/80 p-6">
            <h4 className="mb-4 font-headline text-xl tracking-wide text-white-pure">
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
          <div className="rounded border border-error/30 bg-error-container/20 p-3 text-sm text-error">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {isCurrentUserLeader && (
            <button
              className="flex items-center gap-2 border border-outline-variant/40 bg-surface-container-high/50 px-5 py-2.5 font-label text-xs font-semibold uppercase tracking-wider text-on-surface transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
              onClick={() => {
                // TODO: Open edit team modal
              }}
            >
              <Icon name="edit" />
              Edit Team
            </button>
          )}
          <button
            onClick={handleLeave}
            disabled={actionLoading}
            className="flex items-center gap-2 border border-error/40 bg-error-container/10 px-5 py-2.5 font-label text-xs font-semibold uppercase tracking-wider text-error transition-all hover:border-error/70 hover:bg-error-container/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon name="logout" />
            {actionLoading ? 'Leaving...' : 'Leave Team'}
          </button>
        </div>
      </div>
    );
  }

  return (
    compactWhenNoTeam ? (
      <div className="rounded-lg border border-white/10 bg-black/80 p-6">
        <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-white/50">
          <Icon name="group" className="text-base" />
          Team Status
        </div>

        <h3 className="font-headline text-2xl font-bold text-white">No Team Yet</h3>
        <p className="mt-2 text-sm text-white/60">
          Create your own team here, or head to the Teams tab to join a crew that is already recruiting.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowQuickCreate((current) => !current)}
            className="rounded border border-primary/60 bg-primary/10 px-4 py-2 font-body text-xs font-bold uppercase tracking-[0.08em] text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showQuickCreate ? 'Hide Form' : 'Create Team'}
          </button>
          <button
            type="button"
            onClick={onBrowseTeams}
            className="rounded border border-white/10 bg-white/5 px-4 py-2 font-body text-xs font-bold uppercase tracking-[0.08em] text-white/75 transition-colors hover:bg-white/10 hover:text-white"
          >
            Browse Teams
          </button>
        </div>

        {showQuickCreate && (
          <form onSubmit={handleCreate} className="mt-5 space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
            <div>
              <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">
                Team Name
              </label>
              <input
                type="text"
                required
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. The Neon Dealers"
                className="w-full rounded border border-white/10 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">
                Description
              </label>
              <textarea
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="What are you building?"
                rows={3}
                className="w-full rounded border border-white/10 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading || !createName.trim()}
              className="rounded border border-primary/60 bg-primary/10 px-4 py-2 font-body text-xs font-bold uppercase tracking-[0.08em] text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading ? 'Creating...' : 'Submit Team'}
            </button>
          </form>
        )}
      </div>
    ) : (
    <div className="space-y-8">
      {/* Section Indicator [01] - Create Team */}
      <div>
        <div className="mb-4 flex items-center gap-3 font-label text-xs tracking-wider text-outline">
          <span className="text-primary/80">[01]</span>
          <span className="h-px flex-1 bg-gradient-to-r from-outline-variant/40 to-transparent"></span>
        </div>

        <div className="glass-effect relative overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container/80 p-6">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -left-24 -top-24 h-48 w-48 bg-[radial-gradient(circle,rgba(255,179,177,0.08)_0%,transparent_60%)]"></div>

          <div className="relative z-10">
            <div className="mb-6">
              <h3 className="mb-2 font-headline text-2xl tracking-wide text-white-pure">
                Create New Crew
              </h3>
              <p className="font-label text-sm text-on-surface/70">
                Start your own team and invite others to join your mission
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="mb-2 block font-label text-xs font-semibold uppercase tracking-wider text-outline">
                  Crew Designation <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., The Neon Dealers"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full rounded border border-outline-variant/30 bg-surface-container-highest/50 px-4 py-2.5 text-white placeholder-on-surface/40 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="mb-2 block font-label text-xs font-semibold uppercase tracking-wider text-outline">
                  The Briefing
                </label>
                <textarea
                  placeholder="What will your team build? What's your strategy?"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  className="w-full resize-none rounded border border-outline-variant/30 bg-surface-container-highest/50 px-4 py-2.5 text-white placeholder-on-surface/40 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  rows={4}
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading || !createName.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary-container/60 bg-gradient-to-r from-primary-container to-primary-container/80 px-6 py-3 font-label text-sm font-bold uppercase tracking-wider text-on-primary shadow-lg shadow-primary/20 transition-all hover:border-primary hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {actionLoading ? (
                  'Creating...'
                ) : (
                  <>
                    <Icon name="bolt" fill />
                    Deal Me In
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Section Indicator [02] - Join Team */}
      <div>
        <div className="mb-4 flex items-center gap-3 font-label text-xs tracking-wider text-outline">
          <span className="text-primary/80">[02]</span>
          <span className="h-px flex-1 bg-gradient-to-r from-outline-variant/40 to-transparent"></span>
        </div>

        <div className="glass-effect relative overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container/80 p-6">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 bg-[radial-gradient(circle,rgba(255,179,177,0.08)_0%,transparent_60%)]"></div>

          <div className="relative z-10">
            <div className="mb-6">
              <h3 className="mb-2 font-headline text-2xl tracking-wide text-white-pure">
                Join Existing Crew
              </h3>
              <p className="font-label text-sm text-on-surface/70">
                Have an invite code? Enter it below to join a team
              </p>
            </div>

            <form onSubmit={handleJoin} className="space-y-5">
              <div>
                <label className="mb-2 block font-label text-xs font-semibold uppercase tracking-wider text-outline">
                  Invite Code <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                    <Icon name="key" className="text-secondary-fixed/60" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter 6-character code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={10}
                    className="w-full rounded border border-outline-variant/30 bg-surface-container-highest/50 py-2.5 pl-12 pr-4 font-mono uppercase text-white placeholder-on-surface/40 transition-colors focus:border-secondary-fixed focus:outline-none focus:ring-1 focus:ring-secondary-fixed/30"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 rounded border border-outline-variant/20 bg-surface-container-high/30 p-3">
                <Icon name="info" className="mt-0.5 text-secondary-fixed/80" />
                <p className="font-label text-xs text-on-surface/70">
                  Ask a team leader for their 6-character invite code. Teams can have up to 4 members.
                </p>
              </div>

              <button
                type="submit"
                disabled={actionLoading || joinCode.length < 5}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-secondary-container/60 bg-secondary-container/20 px-6 py-3 font-label text-sm font-bold uppercase tracking-wider text-secondary-fixed shadow-lg shadow-secondary-container/10 transition-all hover:border-secondary-fixed hover:bg-secondary-container/30 hover:shadow-secondary-container/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {actionLoading ? (
                  'Joining...'
                ) : (
                  <>
                    <Icon name="group_add" />
                    Join Crew
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded border border-error/30 bg-error-container/20 p-3 text-sm text-error">
          <Icon name="warning" className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
    )
  );
}
