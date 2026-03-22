import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface User {
  id: string;
  clerk_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  discord_username: string | null;
  looking_for_team: boolean;
  users: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface PlayerCard {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  discordUsername: string | null;
}

function mergeData(users: User[], profiles: Profile[]): PlayerCard[] {
  const profileByUserId = new Map<string, Profile>();
  for (const p of profiles) {
    profileByUserId.set(p.user_id, p);
  }

  const cards: PlayerCard[] = [];

  // First, add all users that have profiles (with enriched data)
  for (const user of users) {
    const profile = profileByUserId.get(user.id);
    if (profile) {
      cards.push({
        id: user.id,
        displayName:
          profile.display_name ||
          [user.first_name, user.last_name].filter(Boolean).join(' ') ||
          'Anonymous Hacker',
        avatarUrl: user.avatar_url,
        bio: profile.bio,
        linkedinUrl: profile.linkedin_url,
        githubUrl: profile.github_url,
        portfolioUrl: profile.portfolio_url,
        discordUsername: profile.discord_username,
      });
      profileByUserId.delete(user.id);
    } else {
      // User without profile — minimal card
      cards.push({
        id: user.id,
        displayName:
          [user.first_name, user.last_name].filter(Boolean).join(' ') ||
          'Anonymous Hacker',
        avatarUrl: user.avatar_url,
        bio: null,
        linkedinUrl: null,
        githubUrl: null,
        portfolioUrl: null,
        discordUsername: null,
      });
    }
  }

  return cards;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function UserGrid() {
  const [players, setPlayers] = useState<PlayerCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setIsLoading(true);
      const [usersResult, profiles] = await Promise.all([
        api.listUsers(),
        api.listAllProfiles(),
      ]);
      const users = usersResult.data ?? usersResult;
      setPlayers(mergeData(users as User[], (profiles ?? []) as Profile[]));
    } catch (error) {
      console.error('Failed to load players:', error);
      setPlayers([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-red/20 border-t-red"></div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
            Loading players...
          </p>
        </div>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="py-12 text-center">
        <h3 className="mb-2 font-display text-2xl text-white">
          No Players Yet
        </h3>
        <p className="font-body text-sm text-white/40">
          No participant profiles are available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-baseline gap-3">
        <h3 className="font-display text-2xl uppercase text-white">Players</h3>
        <span className="font-mono text-[11px] text-white/40">
          ({players.length})
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((player) => {
          const hasSocials =
            player.linkedinUrl ||
            player.githubUrl ||
            player.discordUsername ||
            player.portfolioUrl;

          return (
            <div
              key={player.id}
              className="rounded-lg border border-white/[0.08] bg-[#1a1a1a] p-5 transition-colors hover:border-white/15"
            >
              {/* Top row: avatar + name + bio */}
              <div className="flex items-start gap-3">
                {player.avatarUrl ? (
                  <img
                    src={player.avatarUrl}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.08]">
                    <span className="font-mono text-xs font-semibold text-white/50">
                      {getInitials(player.displayName)}
                    </span>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-sm font-semibold text-white">
                    {player.displayName}
                  </p>
                  {player.bio && (
                    <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-white/45">
                      {player.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Social links */}
              {hasSocials && (
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {player.linkedinUrl && (
                    <a
                      href={player.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/30 transition-colors hover:text-red"
                    >
                      LinkedIn
                    </a>
                  )}
                  {player.githubUrl && (
                    <a
                      href={player.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/30 transition-colors hover:text-red"
                    >
                      GitHub
                    </a>
                  )}
                  {player.portfolioUrl && (
                    <a
                      href={player.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/30 transition-colors hover:text-red"
                    >
                      Portfolio
                    </a>
                  )}
                  {player.discordUsername && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/30">
                      {player.discordUsername}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
