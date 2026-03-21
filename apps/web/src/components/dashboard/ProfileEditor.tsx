import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export function ProfileEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [lookingForTeam, setLookingForTeam] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await api.getProfile();
        if (profile) {
          setDisplayName(profile.display_name || '');
          setBio(profile.bio || '');
          setLinkedinUrl(profile.linkedin_url || '');
          setGithubUrl(profile.github_url || '');
          setPortfolioUrl(profile.portfolio_url || '');
          setLookingForTeam(profile.looking_for_team ?? true);
        }
      } catch (err: unknown) {
        // 404 just means no profile yet, which is fine
        if (err instanceof Error && (err as Error & { status?: number }).status !== 404) {
          setError('Failed to load profile.');
        }
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.upsertProfile({
        display_name: displayName,
        bio: bio || undefined,
        linkedin_url: linkedinUrl || undefined,
        github_url: githubUrl || undefined,
        portfolio_url: portfolioUrl || undefined,
        looking_for_team: lookingForTeam,
      });
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse text-[#FBAE17]">Loading profile...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#FBAE17]/80 mb-1">Display Name *</label>
            <input
              type="text"
              required
              maxLength={100}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-black/40 border border-[#FBAE17]/30 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#FBAE17] transition-colors"
              placeholder="e.g. Hackerman"
            />
          </div>

          <div>
            <label className="block text-sm text-[#FBAE17]/80 mb-1">Bio</label>
            <textarea
              maxLength={500}
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-black/40 border border-[#FBAE17]/30 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#FBAE17] transition-colors resize-none"
              placeholder="Tell others about your skills, interests, and what you want to build..."
            />
          </div>
          
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="lookingForTeam"
              checked={lookingForTeam}
              onChange={(e) => setLookingForTeam(e.target.checked)}
              className="w-5 h-5 accent-[#FBAE17] bg-black/40 border-[#FBAE17]/30 rounded cursor-pointer"
            />
            <label htmlFor="lookingForTeam" className="cursor-pointer text-white">
              I'm actively looking for a team
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#FBAE17]/80 mb-1">LinkedIn URL</label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full bg-black/40 border border-[#FBAE17]/30 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#FBAE17] transition-colors"
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div>
            <label className="block text-sm text-[#FBAE17]/80 mb-1">GitHub URL</label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="w-full bg-black/40 border border-[#FBAE17]/30 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#FBAE17] transition-colors"
              placeholder="https://github.com/..."
            />
          </div>

          <div>
            <label className="block text-sm text-[#FBAE17]/80 mb-1">Portfolio / Website</label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              className="w-full bg-black/40 border border-[#FBAE17]/30 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#FBAE17] transition-colors"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {error && <div className="text-red-400 text-sm p-3 bg-red-900/20 border border-red-500/30 rounded">{error}</div>}
      {successMsg && <div className="text-green-400 text-sm p-3 bg-green-900/20 border border-green-500/30 rounded">{successMsg}</div>}

      <div className="pt-4 border-t border-white/10">
        <button
          type="submit"
          disabled={saving}
          className="bg-[#FBAE17] text-[#0D001A] hover:bg-[#FBAE17]/90 font-['Leckerli_One'] px-8 py-2 md:py-3 rounded-full text-lg md:text-xl transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}
