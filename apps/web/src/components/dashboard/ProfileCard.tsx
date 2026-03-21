import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/astro/react';
import { api } from '@/lib/api';
import ProfileEditorModal from './ProfileEditorModal';

interface Profile {
  user_id: string;
  display_name: string;
  bio?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  looking_for_team: boolean;
}

export default function ProfileCard() {
  const { isLoaded } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const profile = await api.getProfile();
      setProfile(profile);
    } catch (error: unknown) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    const clerkUser = window.Clerk?.user;
    if (clerkUser?.imageUrl) {
      setAvatarUrl(clerkUser.imageUrl);
    }
  }, [isLoaded]);

  const handleProfileUpdated = () => {
    setShowEditor(false);
    loadProfile();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-red/20 border-t-red"></div>
          <p className="font-mono text-sm uppercase tracking-widest text-gray">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-gold/40 bg-black-card/80 p-8 backdrop-blur-sm">
        {/* Ambient gold glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-full -translate-x-1/2 bg-[radial-gradient(circle,rgba(201,168,76,0.08)_0%,transparent_60%)]" />

        <div className="relative z-10 text-center">
          <div className="mb-4 text-5xl">👤</div>
          <h3 className="mb-2 font-display text-2xl tracking-wide text-white-pure">No Profile Yet</h3>
          <p className="mb-6 text-gray">Create your hacker profile to get started with team matching</p>
          <button
            onClick={() => setShowEditor(true)}
            className="border border-gold/40 bg-gold/10 px-6 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-gold transition-all duration-300 hover:border-gold/70 hover:bg-gold/20 hover:shadow-[0_0_20px_rgba(201,168,76,0.15)]"
          >
            Create Profile
          </button>
        </div>

        {showEditor && (
          <ProfileEditorModal
            onClose={() => setShowEditor(false)}
            onSave={handleProfileUpdated}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-lg border border-gold/40 bg-black-card/80 p-8 backdrop-blur-sm transition-all duration-300 hover:border-gold/70 hover:shadow-[0_0_20px_rgba(201,168,76,0.15)]">
        {/* Ambient gold glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-full -translate-x-1/2 bg-[radial-gradient(circle,rgba(201,168,76,0.08)_0%,transparent_60%)]" />

        {/* Card suit decoration */}
        <div className="pointer-events-none absolute right-4 top-4 select-none text-6xl text-gold/10" aria-hidden="true">
          ♦
        </div>

        <div className="relative z-10">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="relative">
                <img
                  src={avatarUrl || 'https://via.placeholder.com/80'}
                  alt={profile.display_name}
                  className="h-20 w-20 rounded-full border-2 border-gold/30"
                />
                {profile.looking_for_team && (
                  <div className="absolute -bottom-1 -right-1 rounded-full border-2 border-black-card bg-green-500 px-2 py-0.5 text-[10px] font-bold text-black">
                    OPEN
                  </div>
                )}
              </div>

              <div>
                <h2 className="font-display text-3xl tracking-wide text-white-pure">{profile.display_name}</h2>
                <p className="mt-1 font-mono text-xs tracking-wider text-gold">// Your Hacker Profile</p>
              </div>
            </div>

            <button
              onClick={() => setShowEditor(true)}
              className="border border-gold/40 bg-gold/10 px-4 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-gold transition-all duration-300 hover:border-gold/70 hover:bg-gold/20 hover:shadow-[0_0_15px_rgba(201,168,76,0.1)]"
            >
              Edit
            </button>
          </div>

          {profile.bio && (
            <div className="mb-6">
              <p className="text-sm leading-relaxed text-white/80">{profile.bio}</p>
            </div>
          )}

          {(profile.github_url || profile.linkedin_url || profile.portfolio_url) && (
            <div className="flex flex-wrap gap-3 border-t border-gold/20 pt-6">
              {profile.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-white/70 transition-all hover:border-gold/40 hover:bg-white/10 hover:text-gold"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c 0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
              )}
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-white/70 transition-all hover:border-gold/40 hover:bg-white/10 hover:text-gold"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>
              )}
              {profile.portfolio_url && (
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-white/70 transition-all hover:border-gold/40 hover:bg-white/10 hover:text-gold"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Portfolio
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {showEditor && (
        <ProfileEditorModal
          initialData={profile}
          onClose={() => setShowEditor(false)}
          onSave={handleProfileUpdated}
        />
      )}
    </>
  );
}
