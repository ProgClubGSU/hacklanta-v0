import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface TeamDetail {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  max_size: number;
  is_looking_for_members: boolean;
  members: TeamMember[];
  join_request_status: string | null;
  join_request_id: string | null;
}

interface TeamDetailModalProps {
  teamId: string;
  onClose: () => void;
  onJoinRequestSent: () => void;
}

export default function TeamDetailModal({ teamId, onClose, onJoinRequestSent }: TeamDetailModalProps) {
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeamDetails();
  }, [teamId]);

  const loadTeamDetails = async () => {
    try {
      setIsLoading(true);
      const teamData = await api.getTeamById(teamId);
      setTeam(teamData);
    } catch (error) {
      console.error('Failed to load team details:', error);
      setError('Failed to load team details');
      setTeam(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRequest = async () => {
    if (!team) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await api.createJoinRequest(teamId, { message: message || undefined });
      onJoinRequestSent();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send join request');
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const isFull = team && team.members.length >= team.max_size;
  const canRequestJoin = team && !team.join_request_status && !isFull;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-red/40 bg-black-card shadow-[0_0_40px_rgba(196,30,58,0.2)]">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-red/20 border-t-red"></div>
              <p className="font-mono text-sm uppercase tracking-widest text-gray">Loading...</p>
            </div>
          </div>
        ) : team ? (
          <>
            <div className="border-b border-red/30 px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-3xl tracking-wide text-white-pure">{team.name}</h2>
                    {isFull ? (
                      <span className="rounded border border-gray/40 bg-gray/10 px-2 py-1 font-mono text-xs font-bold uppercase tracking-wider text-gray">
                        Full
                      </span>
                    ) : (
                      <span className="rounded border border-green-500/40 bg-green-500/10 px-2 py-1 font-mono text-xs font-bold uppercase tracking-wider text-green-500">
                        Open
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-xs tracking-wider text-red">
                    ♠ {team.members.length}/{team.max_size} Members
                  </p>
                </div>
                <button onClick={onClose} className="text-gray transition-colors hover:text-white">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6">
              {team.description && (
                <div>
                  <h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-red/80">Description</h3>
                  <p className="text-sm leading-relaxed text-white/80">{team.description}</p>
                </div>
              )}

              <div>
                <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-red/80">Team Members</h3>
                <div className="space-y-2">
                  {team.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 rounded border border-red/20 bg-red/5 p-3">
                      <img
                        src={member.avatar_url || 'https://via.placeholder.com/40'}
                        alt={member.first_name || 'User'}
                        className="h-10 w-10 rounded-full border-2 border-red/30"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">
                            {member.first_name} {member.last_name}
                          </p>
                          {member.role === 'leader' && (
                            <span className="rounded bg-gold/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-gold">
                              Leader
                            </span>
                          )}
                        </div>
                        {member.email && <p className="font-mono text-xs text-gray">{member.email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {team.join_request_status ? (
                <div className="rounded border border-gold/40 bg-gold/10 p-4">
                  <p className="font-mono text-sm uppercase tracking-wider text-gold">✓ Request {team.join_request_status}</p>
                  <p className="mt-1 text-sm text-white/70">
                    {team.join_request_status === 'pending' &&
                      'Your join request is pending review by the team leader.'}
                    {team.join_request_status === 'approved' && 'You have been approved to join this team!'}
                    {team.join_request_status === 'rejected' && 'Your join request was not accepted.'}
                  </p>
                </div>
              ) : canRequestJoin ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-red/80">
                      Message to Team (Optional)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={500}
                      rows={3}
                      className="w-full resize-none rounded border border-red/30 bg-black/40 px-4 py-2 text-white placeholder-gray transition-colors focus:border-red focus:outline-none"
                      placeholder="Introduce yourself and explain why you'd be a great fit for this team..."
                    />
                    <p className="mt-1 text-right font-mono text-xs text-gray">{message.length}/500</p>
                  </div>

                  {error && (
                    <div className="rounded border border-red/30 bg-red/10 p-3 text-sm text-red-bright">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleJoinRequest}
                    disabled={isSubmitting}
                    className="w-full border border-red/40 bg-red/10 px-6 py-3 font-mono text-sm font-semibold uppercase tracking-wider text-red-bright transition-all hover:border-red/70 hover:bg-red/20 hover:shadow-[0_0_20px_rgba(196,30,58,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending Request...' : 'Request to Join'}
                  </button>
                </div>
              ) : isFull ? (
                <div className="rounded border border-gray/40 bg-gray/10 p-4 text-center">
                  <p className="font-mono text-sm uppercase tracking-wider text-gray">This team is full</p>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <p className="text-red-bright">Failed to load team details</p>
          </div>
        )}
      </div>
    </div>
  );
}
