import { useEffect, useMemo, useState } from 'react';

import { api } from '@/lib/api';
import Icon from '@/components/ui/Icon';
import DiscordCopy from '@/components/ui/DiscordCopy';

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

function SocialIcon({ label }: { label: string }) {
  if (label === 'GitHub') {
    return (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </svg>
  );
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
                  {participant.discord_username && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-white/35">Discord</span>
                      <DiscordCopy username={participant.discord_username} />
                    </div>
                  )}
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
              <div className="space-y-2">
                {participant.discord_username && (
                  <div className="flex items-center gap-2.5 rounded border border-[#5865F2]/30 bg-[#5865F2]/10 px-4 py-2.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#5865F2]">Discord</span>
                    <DiscordCopy username={participant.discord_username} />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {socials.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center rounded border border-white/10 bg-white/5 px-3 py-2 text-white/55 transition-colors hover:border-red/40 hover:text-white"
                      title={social.label}
                      aria-label={social.label}
                    >
                      <SocialIcon label={social.label} />
                    </a>
                  ))}
                </div>
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
