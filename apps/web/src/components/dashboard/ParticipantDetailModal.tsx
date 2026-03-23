import { useEffect, useMemo, useState } from 'react';

import { api } from '@/lib/api';
import Icon from '@/components/ui/Icon';

interface ParticipantTeamSummary {
  id: string;
  name: string;
  role: string;
}

interface ParticipantProfile {
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

interface ParticipantDetailModalProps {
  participant: ParticipantProfile;
  viewerTeam: ViewerTeam | null;
  viewerUserId: string | null;
  onClose: () => void;
  onInvitationSent?: () => void;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
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

export default function ParticipantDetailModal({
  participant,
  viewerTeam,
  viewerUserId,
  onClose,
  onInvitationSent,
}: ParticipantDetailModalProps) {
  const [inviteMessage, setInviteMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const viewerIsLeader = useMemo(() => {
    if (!viewerTeam || !viewerUserId) return false;
    return viewerTeam.members.some(
      (member) => member.user_id === viewerUserId && member.role === 'leader',
    );
  }, [viewerTeam, viewerUserId]);

  const viewerTeamHasSpace = viewerTeam ? viewerTeam.members.length < viewerTeam.max_size : false;

  const canInvite =
    Boolean(viewerTeam) &&
    viewerIsLeader &&
    viewerTeamHasSpace &&
    participant.user_id !== viewerUserId &&
    !participant.current_team;

  async function handleInvite() {
    if (!viewerTeam) return;

    try {
      setIsInviting(true);
      setInviteError(null);
      setInviteSuccess(null);

      await api.inviteParticipantToTeam(
        viewerTeam.id,
        participant.user_id,
        inviteMessage || undefined,
      );

      setInviteSuccess(`Invitation sent to ${participant.display_name}.`);
      setInviteMessage('');
      onInvitationSent?.();
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : 'Failed to send invitation.');
    } finally {
      setIsInviting(false);
    }
  }

  const socials = [
    {
      label: 'LinkedIn',
      value: participant.linkedin_url,
      href: normalizeHref(participant.linkedin_url),
    },
    {
      label: 'GitHub',
      value: participant.github_url,
      href: normalizeHref(participant.github_url),
    },
    {
      label: 'Portfolio',
      value: participant.portfolio_url,
      href: normalizeHref(participant.portfolio_url),
    },
  ].filter((social) => social.value);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-label="Close participant profile"
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-white/10 bg-[#131313] shadow-[0_0_50px_rgba(0,0,0,0.45)]">
        <div className="border-b border-white/8 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {participant.avatar_url ? (
                <img
                  src={participant.avatar_url}
                  alt={participant.display_name}
                  className="h-16 w-16 rounded-full border border-white/10 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 font-mono text-sm text-white/50">
                  {getInitials(participant.display_name)}
                </div>
              )}

              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-3xl uppercase tracking-[-0.03em] text-white">
                    {participant.display_name}
                  </h2>
                  <span
                    className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${
                      participant.looking_for_team
                        ? 'border-transparent bg-transparent text-white'
                        : 'border-transparent bg-transparent text-white'
                    }`}
                  >
                    {participant.looking_for_team ? 'Looking for team' : 'Participant'}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-white/55">
                  {participant.email && <p>{participant.email}</p>}
                  {participant.current_team ? (
                    <p>
                      On team <span className="text-white/80">{participant.current_team.name}</span>
                    </p>
                  ) : (
                    <p>Not currently on a team</p>
                  )}
                  {!participant.has_profile && (
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-gold">
                      No team finder profile filled out yet
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-white/35 transition-colors hover:text-white/80"
              aria-label="Close"
            >
              <Icon name="close" className="text-2xl" />
            </button>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          <section className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">About</p>
            <p className="text-sm leading-relaxed text-white/70">
              {participant.bio?.trim() || 'No bio shared yet.'}
            </p>
          </section>

          {(socials.length > 0 || participant.discord_username) && (
            <section className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                Contact
              </p>
              <div className="flex flex-wrap gap-2">
                {socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className="button-heading rounded border border-white/10 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-white/55 transition-colors hover:border-red/40 hover:text-white"
                  >
                    {social.label}
                  </a>
                ))}
                {participant.discord_username && (
                  <div className="rounded border border-white/10 bg-white/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/55">
                    Discord: <span className="text-white/80">{participant.discord_username}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="rounded-lg border border-white/8 bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Icon name="mail" className="text-red/80" />
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
                Team invitation
              </p>
            </div>

            {canInvite ? (
              <div className="space-y-3">
                <p className="text-sm text-white/65">
                  Invite {participant.display_name} to join{' '}
                  <span className="text-white">{viewerTeam?.name}</span>.
                </p>
                <textarea
                  value={inviteMessage}
                  onChange={(event) => setInviteMessage(event.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder="Optional note to give them some context about your team..."
                  className="w-full resize-none rounded border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-red focus:outline-none"
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30">
                    {inviteMessage.length}/300
                  </p>
                  <button
                    type="button"
                    onClick={handleInvite}
                    disabled={isInviting}
                    className="button-heading rounded border border-red/40 bg-red/10 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-red transition-colors hover:bg-red/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isInviting ? 'Sending...' : 'Send invitation'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-white/55">
                {participant.user_id === viewerUserId && 'You cannot invite yourself.'}
                {participant.user_id !== viewerUserId && participant.current_team && (
                  <span>This participant is already on a team.</span>
                )}
                {participant.user_id !== viewerUserId &&
                  !participant.current_team &&
                  !viewerTeam &&
                  'Join or create a team to invite participants.'}
                {participant.user_id !== viewerUserId &&
                  !participant.current_team &&
                  viewerTeam &&
                  !viewerIsLeader &&
                  'Only team leaders can send invitations.'}
                {participant.user_id !== viewerUserId &&
                  !participant.current_team &&
                  viewerTeam &&
                  viewerIsLeader &&
                  !viewerTeamHasSpace &&
                  'Your team is already full.'}
              </div>
            )}

            {inviteError && (
              <div className="mt-3 rounded border border-red/30 bg-red/10 px-3 py-2 text-sm text-red-200">
                {inviteError}
              </div>
            )}

            {inviteSuccess && (
              <div className="mt-3 rounded border border-[#00ff88]/30 bg-[#00ff88]/10 px-3 py-2 text-sm text-[#8cffc4]">
                {inviteSuccess}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
