import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface ProfileEditorModalProps {
  initialData?: {
    display_name: string;
    bio?: string;
    linkedin_url?: string;
    github_url?: string;
    portfolio_url?: string;
    looking_for_team: boolean;
  };
  onClose: () => void;
  onSave: () => void;
}

export default function ProfileEditorModal({ initialData, onClose, onSave }: ProfileEditorModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState(initialData?.display_name || '');
  const [bio, setBio] = useState(initialData?.bio || '');
  const [linkedinUrl, setLinkedinUrl] = useState(initialData?.linkedin_url || '');
  const [githubUrl, setGithubUrl] = useState(initialData?.github_url || '');
  const [portfolioUrl, setPortfolioUrl] = useState(initialData?.portfolio_url || '');
  const [lookingForTeam, setLookingForTeam] = useState(initialData?.looking_for_team ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await api.upsertProfile({
        display_name: displayName,
        bio: bio || undefined,
        linkedin_url: linkedinUrl || undefined,
        github_url: githubUrl || undefined,
        portfolio_url: portfolioUrl || undefined,
        looking_for_team: lookingForTeam,
      });
      onSave();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
      setSaving(false);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border border-gold/40 bg-black-card shadow-[0_0_40px_rgba(201,168,76,0.2)]">
        {/* Header */}
        <div className="sticky top-0 z-20 border-b border-gold/30 bg-black-card/95 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl tracking-wide text-white-pure">
                {initialData ? 'Edit Profile' : 'Create Profile'}
              </h2>
              <p className="mt-1 font-mono text-xs tracking-wider text-gold">// Hacker Profile Setup</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray transition-colors hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-gold/80">
                  Display Name <span className="text-red-bright">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded border border-gold/30 bg-black/40 px-4 py-2 text-white placeholder-gray transition-colors focus:border-gold focus:outline-none"
                  placeholder="e.g. Hackerman"
                />
              </div>

              <div>
                <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-gold/80">
                  Bio
                </label>
                <textarea
                  maxLength={500}
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full resize-none rounded border border-gold/30 bg-black/40 px-4 py-2 text-white placeholder-gray transition-colors focus:border-gold focus:outline-none"
                  placeholder="Tell others about your skills, interests, and what you want to build..."
                />
                <p className="mt-1 text-right font-mono text-xs text-gray">
                  {bio.length}/500
                </p>
              </div>

              <div className="flex items-center gap-3 rounded border border-gold/20 bg-gold/5 p-3">
                <input
                  type="checkbox"
                  id="lookingForTeam"
                  checked={lookingForTeam}
                  onChange={(e) => setLookingForTeam(e.target.checked)}
                  className="h-5 w-5 cursor-pointer accent-gold"
                />
                <label htmlFor="lookingForTeam" className="cursor-pointer text-sm text-white">
                  I'm actively looking for a team
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-gold/80">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full rounded border border-gold/30 bg-black/40 px-4 py-2 text-white placeholder-gray transition-colors focus:border-gold focus:outline-none"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div>
                <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-gold/80">
                  GitHub URL
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full rounded border border-gold/30 bg-black/40 px-4 py-2 text-white placeholder-gray transition-colors focus:border-gold focus:outline-none"
                  placeholder="https://github.com/..."
                />
              </div>

              <div>
                <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-gold/80">
                  Portfolio / Website
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="w-full rounded border border-gold/30 bg-black/40 px-4 py-2 text-white placeholder-gray transition-colors focus:border-gold focus:outline-none"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded border border-red/30 bg-red/10 p-3 text-sm text-red-bright">
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-8 flex items-center justify-end gap-3 border-t border-gold/20 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="border border-white/20 bg-white/5 px-6 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-white transition-all hover:border-white/40 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !displayName.trim()}
              className="border border-gold/40 bg-gold/10 px-6 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-gold transition-all hover:border-gold/70 hover:bg-gold/20 hover:shadow-[0_0_20px_rgba(201,168,76,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
