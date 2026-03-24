import { useState } from 'react';
import { api } from '@/lib/api';

interface OnboardingCardProps {
  clerkFirstName: string | null;
  clerkLastName: string | null;
  clerkEmail: string;
  onComplete: () => void;
}

function ProgressRing({ percent }: { percent: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color = percent >= 100 ? '#00ff88' : percent >= 60 ? '#C9A84C' : '#C41E3A';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" className="transform -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
        />
      </svg>
      <span className="absolute font-mono text-lg text-white">{percent}%</span>
    </div>
  );
}

type FieldKey = 'displayName' | 'linkedin' | 'discord' | 'github' | 'portfolio' | 'bio';

const FIELD_CONFIG: {
  key: FieldKey;
  label: string;
  required: boolean;
  placeholder: string;
  type: 'text' | 'textarea';
}[] = [
  { key: 'displayName', label: 'Display Name', required: true, placeholder: 'Your display name', type: 'text' },
  { key: 'linkedin', label: 'LinkedIn URL', required: true, placeholder: 'linkedin.com/in/your-profile', type: 'text' },
  { key: 'discord', label: 'Discord Username', required: true, placeholder: 'username#1234 or just username', type: 'text' },
  { key: 'github', label: 'GitHub URL', required: false, placeholder: 'github.com/username', type: 'text' },
  { key: 'portfolio', label: 'Portfolio URL', required: false, placeholder: 'yoursite.com', type: 'text' },
  { key: 'bio', label: 'Bio', required: false, placeholder: 'Tell potential teammates about yourself...', type: 'textarea' },
];

const TRACKED_FIELDS: FieldKey[] = ['displayName', 'linkedin', 'discord', 'github', 'bio'];

export default function OnboardingCard({
  clerkFirstName,
  clerkLastName,
  clerkEmail,
  onComplete,
}: OnboardingCardProps) {
  const defaultDisplayName = [clerkFirstName, clerkLastName].filter(Boolean).join(' ');

  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [linkedin, setLinkedin] = useState('');
  const [discord, setDiscord] = useState('');
  const [github, setGithub] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldValues: Record<FieldKey, string> = {
    displayName,
    linkedin,
    discord,
    github,
    portfolio,
    bio,
  };

  const setters: Record<FieldKey, (val: string) => void> = {
    displayName: setDisplayName,
    linkedin: setLinkedin,
    discord: setDiscord,
    github: setGithub,
    portfolio: setPortfolio,
    bio: setBio,
  };

  const filledCount = TRACKED_FIELDS.filter((k) => fieldValues[k].trim().length > 0).length;
  const percent = Math.round((filledCount / TRACKED_FIELDS.length) * 100);

  const requiredFilled =
    displayName.trim().length > 0 &&
    linkedin.trim().length > 0 &&
    discord.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // discord_username will be accepted once the profiles schema is updated by another agent
      await api.upsertProfile({
        display_name: displayName.trim(),
        linkedin_url: linkedin.trim() || undefined,
        discord_username: discord.trim() || undefined,
        github_url: github.trim() || undefined,
        portfolio_url: portfolio.trim() || undefined,
        bio: bio.trim() || undefined,
        looking_for_team: true,
      } as Parameters<typeof api.upsertProfile>[0]);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save your profile.');
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-black/80 p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <ProgressRing percent={percent} />
        <div className="text-center sm:text-left">
          <h2 className="font-display text-4xl uppercase tracking-[-0.04em] sm:text-5xl">
            <span className="font-bold text-red-bright" style={{ textShadow: '0 0 20px rgba(196,30,58,0.5), 0 0 40px rgba(196,30,58,0.25)' }}>Confirm attendance</span>{' '}
            <span className="italic text-white">&amp; find team</span>
          </h2>
          <p className="mt-2 max-w-xl font-body text-sm leading-6 text-white/60">
            Before you find a team, let others find you. This is how prospective teammates will
            message and reach out to you.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {FIELD_CONFIG.map((field) => {
          const value = fieldValues[field.key];
          const filled = value.trim().length > 0;

          return (
            <div key={field.key}>
              <label className="mb-2 flex items-center gap-2">
                {/* Status indicator */}
                {filled ? (
                  <svg
                    className="h-3.5 w-3.5 flex-shrink-0"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <circle cx="8" cy="8" r="8" fill="#00ff88" />
                    <path
                      d="M5 8.5L7 10.5L11 6"
                      stroke="#0a0a0a"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : field.required ? (
                  <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-[#C41E3A]" />
                  </span>
                ) : (
                  <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-white/20" />
                  </span>
                )}

                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/80">
                  {field.label}
                </span>
                {field.required ? (
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C41E3A]">
                    <span className="text-[#C41E3A]">*</span> (required)
                  </span>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                    (optional)
                  </span>
                )}
              </label>

              {field.type === 'textarea' ? (
                <div>
                  <textarea
                    rows={4}
                    maxLength={500}
                    value={value}
                    onChange={(e) => setters[field.key](e.target.value)}
                    className="w-full resize-none rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-body text-white placeholder:text-white/30 focus:border-red focus:outline-none"
                    placeholder={field.placeholder}
                  />
                  <p className="mt-1 text-right font-mono text-[10px] text-white/40">
                    {bio.length}/500
                  </p>
                </div>
              ) : (
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setters[field.key](e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-body text-white placeholder:text-white/30 focus:border-red focus:outline-none"
                  placeholder={field.placeholder}
                />
              )}
            </div>
          );
        })}

        {/* Error */}
        {error && (
          <div className="rounded border border-red/30 bg-red/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!requiredFilled || isSaving}
          className="button-heading mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#C41E3A] px-6 py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#E63946] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
        >
          {isSaving ? (
            'Saving...'
          ) : (
            <>
              Lock In Profile
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
