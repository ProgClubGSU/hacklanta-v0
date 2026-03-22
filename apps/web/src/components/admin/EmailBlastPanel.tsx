import { useRef, useState } from 'react';
import { adminApi, type EmailBlastResult } from '../../lib/admin-api';

const STATUS_OPTIONS = ['pending', 'accepted', 'accepted_overflow', 'rejected', 'waitlisted'];
const EXPERIENCE_OPTIONS = ['beginner', 'intermediate', 'advanced'];
const YEAR_OPTIONS = ['freshman', 'sophomore', 'junior', 'senior', 'graduate'];

interface Filters {
  status: string[];
  university: string;
  experience_level: string[];
  year_of_study: string[];
  is_accepted: boolean | undefined;
}

function TogglePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
        active
          ? 'border border-red/40 bg-red/20 text-red'
          : 'border border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
      }`}
    >
      {label}
    </button>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
      {children}
    </p>
  );
}

export default function EmailBlastPanel() {
  const [filters, setFilters] = useState<Filters>({
    status: [],
    university: '',
    experience_level: [],
    year_of_study: [],
    is_accepted: undefined,
  });

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<EmailBlastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewKey, setPreviewKey] = useState(0);

  function toggleFilter(
    key: 'status' | 'experience_level' | 'year_of_study',
    value: string,
  ) {
    setFilters((prev) => {
      const current = prev[key];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  }

  function buildApiFilters(): Record<string, unknown> {
    const apiFilters: Record<string, unknown> = {};
    if (filters.status.length > 0) apiFilters.status = filters.status;
    if (filters.university) apiFilters.university = filters.university;
    if (filters.experience_level.length > 0)
      apiFilters.experience_level = filters.experience_level;
    if (filters.year_of_study.length > 0)
      apiFilters.year_of_study = filters.year_of_study;
    if (filters.is_accepted !== undefined)
      apiFilters.is_accepted = filters.is_accepted;
    return apiFilters;
  }

  async function handleSend(dryRun: boolean) {
    if (!subject.trim() || !body.trim()) {
      setError('Subject and body are required.');
      return;
    }

    setError(null);
    setResult(null);
    setIsSending(true);

    try {
      if (!dryRun) {
        // Run a dry run first to get the count for the confirm dialog
        const preview = await adminApi.sendEmailBlast({
          subject: subject.trim(),
          body: body.trim(),
          filters: buildApiFilters(),
          dry_run: true,
        });

        const count = preview.recipient_count ?? 0;
        if (
          !window.confirm(
            `Send email to ${count} recipient${count !== 1 ? 's' : ''}? This cannot be undone.`,
          )
        ) {
          setIsSending(false);
          return;
        }
      }

      const res = await adminApi.sendEmailBlast({
        subject: subject.trim(),
        body: body.trim(),
        filters: buildApiFilters(),
        dry_run: dryRun,
      });

      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email blast.');
    } finally {
      setIsSending(false);
    }
  }

  const hasPreviewContent = subject.trim() && body.trim();
  const previewUrl = hasPreviewContent
    ? `/api/admin/preview-email?template=announcement&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}&name=Preview`
    : null;

  return (
    <div className="space-y-6">
      {/* Section 1: Audience Filters */}
      <div className="rounded-lg border border-white/10 bg-black-card p-6">
        <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
          // audience_filters
        </p>

        <div className="space-y-5">
          {/* Status */}
          <div>
            <FilterLabel>Application Status</FilterLabel>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <TogglePill
                  key={s}
                  label={s.replace('_', ' ')}
                  active={filters.status.includes(s)}
                  onClick={() => toggleFilter('status', s)}
                />
              ))}
            </div>
          </div>

          {/* University */}
          <div>
            <FilterLabel>University</FilterLabel>
            <input
              type="text"
              value={filters.university}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, university: e.target.value }))
              }
              placeholder="Filter by university..."
              className="w-full border border-white/10 bg-black/40 px-4 py-3 font-body text-sm text-white placeholder:text-white/30 focus:border-red focus:outline-none"
            />
          </div>

          {/* Experience Level */}
          <div>
            <FilterLabel>Experience Level</FilterLabel>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_OPTIONS.map((level) => (
                <TogglePill
                  key={level}
                  label={level}
                  active={filters.experience_level.includes(level)}
                  onClick={() => toggleFilter('experience_level', level)}
                />
              ))}
            </div>
          </div>

          {/* Year of Study */}
          <div>
            <FilterLabel>Year of Study</FilterLabel>
            <div className="flex flex-wrap gap-2">
              {YEAR_OPTIONS.map((year) => (
                <TogglePill
                  key={year}
                  label={year}
                  active={filters.year_of_study.includes(year)}
                  onClick={() => toggleFilter('year_of_study', year)}
                />
              ))}
            </div>
          </div>

          {/* Is Accepted Toggle */}
          <div>
            <FilterLabel>Accepted Users Only</FilterLabel>
            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  is_accepted:
                    prev.is_accepted === undefined
                      ? true
                      : prev.is_accepted
                        ? false
                        : undefined,
                }))
              }
              className={`flex items-center gap-3 rounded px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                filters.is_accepted === true
                  ? 'border border-red/40 bg-red/20 text-red'
                  : filters.is_accepted === false
                    ? 'border border-white/20 bg-white/10 text-white/70'
                    : 'border border-white/10 bg-white/5 text-white/40'
              }`}
            >
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full transition-colors ${
                  filters.is_accepted === true
                    ? 'bg-red'
                    : filters.is_accepted === false
                      ? 'bg-white/50'
                      : 'bg-white/20'
                }`}
              />
              {filters.is_accepted === true
                ? 'On — Accepted only'
                : filters.is_accepted === false
                  ? 'Off — Not accepted only'
                  : 'Off — All users'}
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Compose */}
      <div className="rounded-lg border border-white/10 bg-black-card p-6">
        <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
          // compose
        </p>

        <div className="space-y-4">
          <div>
            <FilterLabel>Subject</FilterLabel>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line..."
              className="w-full border border-white/10 bg-black/40 px-4 py-3 font-body text-sm text-white placeholder:text-white/30 focus:border-red focus:outline-none"
            />
          </div>

          <div>
            <FilterLabel>Body</FilterLabel>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={7}
              placeholder="Write your message... (separate paragraphs with blank lines)"
              className="w-full resize-none border border-white/10 bg-black/40 px-4 py-3 font-body text-sm text-white placeholder:text-white/30 focus:border-red focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Preview */}
      {previewUrl && (
        <div className="rounded-lg border border-white/10 bg-black-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
              // preview
            </p>
            <button
              type="button"
              onClick={() => setPreviewKey((k) => k + 1)}
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-white/50 transition-colors hover:bg-white/10 hover:text-white/70"
            >
              Refresh Preview
            </button>
          </div>

          <iframe
            key={previewKey}
            ref={iframeRef}
            src={previewUrl}
            title="Email preview"
            className="h-[500px] w-full rounded-lg border border-white/10 bg-black"
          />
        </div>
      )}

      {/* Section 4: Actions */}
      <div className="rounded-lg border border-white/10 bg-black-card p-6">
        <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
          // actions
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isSending || !subject.trim() || !body.trim()}
            onClick={() => handleSend(true)}
            className="rounded border border-white/10 bg-white/5 px-5 py-2.5 font-body text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSending ? 'Running...' : 'Dry Run'}
          </button>

          <button
            type="button"
            disabled={isSending || !subject.trim() || !body.trim()}
            onClick={() => handleSend(false)}
            className="rounded border border-red/50 bg-red/10 px-5 py-2.5 font-body text-sm font-semibold text-red transition-colors hover:bg-red/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSending ? 'Sending...' : 'Send Email Blast'}
          </button>
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-4 rounded border border-red/30 bg-red/10 px-4 py-3 font-body text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Result display */}
        {result && (
          <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-5">
            {result.dry_run ? (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-gold" />
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
                    Dry Run Result
                  </p>
                </div>
                <p className="font-mono text-3xl font-bold tracking-tight text-white">
                  {(result.recipient_count ?? 0).toLocaleString()}
                  <span className="ml-2 text-sm font-normal text-white/40">
                    recipient{result.recipient_count !== 1 ? 's' : ''}
                  </span>
                </p>
                {result.sample_emails && result.sample_emails.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                      Sample Recipients
                    </p>
                    <ul className="space-y-1">
                      {result.sample_emails.map((email) => (
                        <li
                          key={email}
                          className="font-mono text-xs text-white/60"
                        >
                          {email}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#00ff88]" />
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#00ff88]">
                    Blast Sent
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                      Sent
                    </p>
                    <p className="font-mono text-2xl font-bold text-[#00ff88]">
                      {result.sent ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                      Errors
                    </p>
                    <p className="font-mono text-2xl font-bold text-red">
                      {result.errors ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                      Total
                    </p>
                    <p className="font-mono text-2xl font-bold text-white">
                      {result.total ?? 0}
                    </p>
                  </div>
                </div>
                {result.errorDetails && result.errorDetails.length > 0 && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-red/80">
                      Error Details
                    </p>
                    <ul className="space-y-1">
                      {result.errorDetails.map((detail, i) => (
                        <li
                          key={i}
                          className="font-mono text-xs text-white/50"
                        >
                          <span className="text-red/70">{detail.email}</span>
                          {' — '}
                          {detail.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
