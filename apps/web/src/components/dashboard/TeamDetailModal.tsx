import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { TRACKS } from '@/lib/tracks';
import DiscordCopy from '@/components/ui/DiscordCopy';
import LoadingHand from './casino/LoadingHand';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  discord_username: string | null;
  linkedin_url: string | null;
}

interface TeamDetail {
  id: string;
  name: string;
  description: string | null;
  tracks: string[] | null;
  invite_code: string;
  max_size: number;
  is_looking_for_members: boolean;
  members: TeamMember[];
  join_request_status: string | null;
  join_request_id: string | null;
  viewer_team_id: string | null;
  viewer_is_member: boolean;
  viewer_role: string | null;
}

interface TeamDetailModalProps {
  teamId: string;
  onClose: () => void;
  onJoinRequestSent: () => void;
}

function getMemberName(member: TeamMember) {
  const fullName = `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim();
  return fullName || 'Anonymous Hacker';
}

function getMemberInitials(member: TeamMember) {
  const first = member.first_name?.[0] ?? '';
  const last = member.last_name?.[0] ?? '';
  return (first + last).toUpperCase() || '??';
}

function normalizeHref(value: string | null) {
  if (!value?.trim()) return '';
  if (/^http:\/\//i.test(value)) return value.replace(/^http:/i, 'https:');
  return /^https:\/\//i.test(value) ? value : `https://${value}`;
}

function SocialIcon({ label }: { label: string }) {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.369A19.791 19.791 0 0015.558 3c-.206.375-.444.88-.608 1.275a18.27 18.27 0 00-5.9 0A12.64 12.64 0 008.442 3a19.736 19.736 0 00-4.76 1.369C.533 9.037-.32 13.579.107 18.057a19.9 19.9 0 005.993 3.043c.485-.666.918-1.37 1.296-2.106-.714-.268-1.396-.598-2.038-.98.17-.124.336-.253.496-.387 3.93 1.848 8.188 1.848 12.072 0 .162.134.328.263.496.387-.644.383-1.327.713-2.042.98.378.737.812 1.44 1.297 2.106a19.88 19.88 0 005.995-3.043c.5-5.19-.854-9.691-3.355-13.688zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.334.955-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.961 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.334.955-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z" />
    </svg>
  );
}

export default function TeamDetailModal({
  teamId,
  onClose,
  onJoinRequestSent,
}: TeamDetailModalProps) {
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLeavingTeam, setIsLeavingTeam] = useState(false);
  const [kickingMemberId, setKickingMemberId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadTeamDetails();
  }, [teamId]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  async function loadTeamDetails() {
    try {
      setIsLoading(true);
      setError(null);
      const teamData = await api.getTeamById(teamId);
      setTeam(teamData as TeamDetail);
    } catch (loadError) {
      console.error('Failed to load team details:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Failed to load team details.');
      setTeam(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoinRequest() {
    if (!team) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await api.createJoinRequest(team.id, { message: message || undefined });
      onJoinRequestSent();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to send join request.');
      setIsSubmitting(false);
    }
  }

  async function handleLeaveTeam() {
    if (!team) return;
    if (!confirm(`Leave ${team.name}?`)) return;

    try {
      setIsLeavingTeam(true);
      setError(null);
      await api.leaveTeam();
      onClose();
      onJoinRequestSent();
    } catch (leaveError) {
      setError(leaveError instanceof Error ? leaveError.message : 'Failed to leave team.');
      setIsLeavingTeam(false);
    }
  }

  async function handleKickMember(memberId: string, memberName: string) {
    if (!team) return;
    if (!confirm(`Remove ${memberName} from ${team.name}?`)) return;

    try {
      setKickingMemberId(memberId);
      setError(null);
      await api.kickMember(team.id, memberId);
      await loadTeamDetails();
      onJoinRequestSent();
    } catch (kickError) {
      setError(kickError instanceof Error ? kickError.message : 'Failed to remove member.');
    } finally {
      setKickingMemberId(null);
    }
  }

  const isViewerLeader = team?.viewer_role === 'leader';
  const isFull = team ? team.members.length >= team.max_size : false;
  const alreadyOnAnotherTeam = team
    ? Boolean(team.viewer_team_id && !team.viewer_is_member)
    : false;
  const canRequestJoin =
    team && !team.join_request_status && !isFull && !alreadyOnAnotherTeam && !team.viewer_is_member;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-label="Close team profile"
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-red/40 bg-black-card shadow-[0_0_40px_rgba(196,30,58,0.2)]">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <LoadingHand label="Turning the next card..." compact />
          </div>
        ) : team ? (
          <>
            <div className="border-b border-red/30 px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-3xl tracking-wide text-white-pure">
                      {team.name}
                    </h2>
                    {team.viewer_is_member && (
                      <span className="rounded border border-transparent bg-transparent px-2 py-1 font-mono text-xs font-bold uppercase tracking-wider text-white">
                        Your team
                      </span>
                    )}
                    {isFull ? (
                      <span className="rounded border border-transparent bg-transparent px-2 py-1 font-mono text-xs font-bold uppercase tracking-wider text-white">
                        Full
                      </span>
                    ) : (
                      <span className="rounded border border-transparent bg-transparent px-2 py-1 font-mono text-xs font-bold uppercase tracking-wider text-white">
                        Open
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-xs font-medium tracking-wider text-red-bright">
                    Members {team.members.length}/{team.max_size}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray transition-colors hover:text-white"
                  aria-label="Close"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6">
              {team.description && (
                <div>
                  <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-red">
                    Description
                  </h3>
                  <p className="text-sm leading-relaxed text-white/90">{team.description}</p>
                </div>
              )}

              {team.tracks && team.tracks.length > 0 && (
                <div>
                  <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-red">
                    Tracks
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {team.tracks.map((trackName) => {
                      const track = TRACKS.find((item) => item.name === trackName);
                      if (!track) return null;

                      return (
                        <span
                          key={track.id}
                          className={`rounded-sm border px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em] ${track.bgClass}`}
                        >
                          {track.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-red">
                  Team Members
                </h3>
                <div className="space-y-2">
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 rounded border border-white/10 bg-white/[0.04] p-3"
                    >
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={getMemberName(member)}
                          className="h-10 w-10 rounded-full border-2 border-white/20 object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 font-mono text-[10px] font-bold text-white/80">
                          {getMemberInitials(member)}
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{getMemberName(member)}</p>
                          {member.role === 'leader' && (
                            <span className="rounded border border-transparent bg-transparent px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
                              Leader
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-3">
                          {member.discord_username && (
                            <span className="flex items-center gap-1 text-xs">
                              <span className="text-[#5865F2]/80">
                                <DiscordIcon />
                              </span>
                              <DiscordCopy
                                username={member.discord_username}
                                size="sm"
                                className="font-mono text-[#5865F2]"
                              />
                            </span>
                          )}
                          {member.linkedin_url && (
                            <a
                              href={normalizeHref(member.linkedin_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-white/60 hover:text-white/80"
                              title="LinkedIn"
                              aria-label="LinkedIn"
                            >
                              <SocialIcon label="LinkedIn" />
                            </a>
                          )}
                        </div>
                      </div>

                      {isViewerLeader && member.role !== 'leader' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleKickMember(member.user_id, getMemberName(member));
                          }}
                          disabled={kickingMemberId === member.user_id}
                          className="shrink-0 rounded border border-red/30 bg-red/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-red transition-colors hover:bg-red/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {kickingMemberId === member.user_id ? '...' : 'Remove'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {team.viewer_is_member && (
                <div className="rounded border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-red">
                        Team Controls
                      </p>
                      <p className="mt-1 text-sm text-white/75">
                        Need to switch teams? You can leave this one here.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLeaveTeam}
                      disabled={isLeavingTeam}
                      className="button-heading rounded border border-red/30 bg-red/10 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-red transition-colors hover:bg-red/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLeavingTeam ? 'Leaving...' : 'Leave team'}
                    </button>
                  </div>
                </div>
              )}

              {team.join_request_status ? (
                <div className="rounded border border-gold/40 bg-gold/10 p-4">
                  <p className="font-mono text-sm uppercase tracking-wider text-gold">
                    Request {team.join_request_status}
                  </p>
                  <p className="mt-1 text-sm text-white/80">
                    {team.join_request_status === 'pending' &&
                      'Your join request is pending review by the team leader.'}
                    {team.join_request_status === 'approved' &&
                      'Your request was approved and you can join this team now.'}
                    {team.join_request_status === 'rejected' &&
                      'Your join request was not accepted.'}
                  </p>
                </div>
              ) : canRequestJoin ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-wider text-red">
                      Message to Team (Optional)
                    </label>
                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      maxLength={500}
                      rows={3}
                      className="w-full resize-none rounded border border-red/30 bg-black/40 px-4 py-2 text-white placeholder-gray transition-colors focus:border-red focus:outline-none"
                      placeholder="Introduce yourself and explain why you'd be a great fit for this team..."
                    />
                    <p className="mt-1 text-right font-mono text-xs text-gray">
                      {message.length}/500
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleJoinRequest}
                    disabled={isSubmitting}
                    className="button-heading w-full border border-red/40 bg-red/10 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-red-bright transition-all hover:border-red/70 hover:bg-red/20 hover:shadow-[0_0_20px_rgba(196,30,58,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending Request...' : 'Request to Join'}
                  </button>
                </div>
              ) : (
                <div className="rounded border border-white/10 bg-white/[0.03] p-4 text-sm text-white/75">
                  {team.viewer_is_member && 'You are already on this team.'}
                  {!team.viewer_is_member &&
                    alreadyOnAnotherTeam &&
                    'Leave your current team before requesting to join another one.'}
                  {!team.viewer_is_member &&
                    !alreadyOnAnotherTeam &&
                    isFull &&
                    'This team is full.'}
                </div>
              )}

              {error && (
                <div className="rounded border border-red/30 bg-red/10 p-3 text-sm text-red-bright">
                  {error}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <p className="text-red-bright">Failed to load team details.</p>
          </div>
        )}
      </div>
    </div>
  );
}
