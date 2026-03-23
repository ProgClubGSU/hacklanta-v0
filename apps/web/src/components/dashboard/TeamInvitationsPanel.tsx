import { useEffect, useState } from 'react';

import Icon from '@/components/ui/Icon';
import { api } from '@/lib/api';
import { TEAM_CHANGED_EVENT } from '@/lib/dashboard-events';
import { TRACKS } from '@/lib/tracks';
import CasinoSpinner from './casino/CasinoSpinner';

interface InvitationTeam {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  max_size: number;
  member_count: number;
  tracks: string[] | null;
}

interface InvitationInviter {
  id: string;
  name: string;
  avatar_url: string | null;
  email: string | null;
}

interface TeamInvitation {
  id: string;
  team_id: string;
  created_at: string;
  expires_at: string;
  message: string | null;
  team: InvitationTeam | null;
  inviter: InvitationInviter | null;
}

export default function TeamInvitationsPanel() {
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    void loadInvitations();

    const handleTeamChanged = () => {
      void loadInvitations();
    };

    window.addEventListener(TEAM_CHANGED_EVENT, handleTeamChanged);
    return () => window.removeEventListener(TEAM_CHANGED_EVENT, handleTeamChanged);
  }, []);

  async function loadInvitations() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.listReceivedTeamInvitations();
      setInvitations(data as TeamInvitation[]);
    } catch {
      // No invitations or table inaccessible — treat as empty
      setInvitations([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResponse(invitationId: string, response: 'accepted' | 'declined') {
    try {
      setProcessingId(invitationId);
      setError(null);
      await api.respondToTeamInvitation(invitationId, response);
      await loadInvitations();
    } catch (responseError) {
      setError(
        responseError instanceof Error ? responseError.message : 'Failed to update invitation.',
      );
    } finally {
      setProcessingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3 text-white/45">
          <CasinoSpinner variant="chip-flip" size={20} color="red" />
          <span className="font-mono text-[11px] uppercase tracking-[0.16em]">
            Shuffling the deck...
          </span>
        </div>
      </div>
    );
  }

  if (invitations.length === 0 && !error) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3">
          <span className="text-xl text-white/30">♠</span>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-white/50">
              NO INVITES IN HAND
            </p>
            <p className="mt-1 font-body text-xs text-white/35">
              Team leaders will send you invites when they want you at their table.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">Invitations</p>
          <h3 className="mt-1 font-display text-2xl uppercase tracking-[-0.03em] text-white">
            Team invites waiting on you
          </h3>
        </div>
        <div className="rounded-full border border-gold/20 bg-gold/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-gold">
          {invitations.length}
        </div>
      </div>

      {error && (
        <div className="rounded border border-red/30 bg-red/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {invitations.map((invitation) => {
          const isProcessing = processingId === invitation.id;
          const team = invitation.team;

          return (
            <div key={invitation.id} className="rounded-lg border border-white/8 bg-black/20 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-display text-xl uppercase tracking-[-0.03em] text-white">
                        {team?.name ?? 'Team'}
                      </h4>
                      {team && (
                        <span className="rounded border border-transparent bg-transparent px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white">
                          {team.member_count}/{team.max_size}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-white/55">
                      Invited by {invitation.inviter?.name ?? 'a team leader'}
                    </p>
                  </div>

                  {team?.description && (
                    <p className="text-sm leading-relaxed text-white/65">{team.description}</p>
                  )}

                  {team?.tracks && team.tracks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {team.tracks.map((trackName) => {
                        const track = TRACKS.find((item) => item.name === trackName);
                        if (!track) return null;

                        return (
                          <span
                            key={track.id}
                            className={`rounded-sm border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] ${track.bgClass}`}
                          >
                            {track.id}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {invitation.message && (
                    <div className="rounded border border-white/8 bg-white/5 px-3 py-3 text-sm italic leading-relaxed text-white/70">
                      "{invitation.message}"
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">
                    <span className="flex items-center gap-1">
                      <Icon name="schedule" className="text-sm" />
                      Expires {new Date(invitation.expires_at).toLocaleDateString()}
                    </span>
                    {team?.invite_code && <span>Code: {team.invite_code}</span>}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleResponse(invitation.id, 'accepted')}
                    disabled={isProcessing}
                    className="button-heading rounded border border-[#00ff88]/30 bg-[#00ff88]/10 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-[#00ff88] transition-colors hover:bg-[#00ff88]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isProcessing ? 'Working...' : 'Accept'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResponse(invitation.id, 'declined')}
                    disabled={isProcessing}
                    className="button-heading rounded border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-white/55 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
