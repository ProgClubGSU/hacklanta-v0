import { useEffect, useState } from 'react';
import { adminApi, type StatsData } from '../../lib/admin-api';

interface StatCard {
  label: string;
  value: number;
  color: string;
}

function StatCardItem({ label, value, color }: StatCard) {
  return (
    <div className="rounded-lg border border-white/10 bg-black-card p-6">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
        {label}
      </p>
      <p
        className="font-mono text-4xl font-bold tracking-tight"
        style={{
          color,
          textShadow: `0 0 20px ${color}40`,
        }}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

export default function StatsOverview() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [acceptResult, setAcceptResult] = useState<{
    sent: number;
    errors: number;
    total: number;
  } | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  function loadStats() {
    setIsLoading(true);
    setError(null);
    adminApi
      .getStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadStats();
  }, []);

  async function handleSendAcceptance() {
    setIsAccepting(true);
    setAcceptError(null);
    setAcceptResult(null);

    try {
      const res = await adminApi.sendAcceptanceEmails();
      setAcceptResult(res);
      // Refresh stats after sending
      loadStats();
    } catch (err) {
      setAcceptError(
        err instanceof Error ? err.message : 'Failed to send acceptance emails.',
      );
    } finally {
      setIsAccepting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-red/20 border-t-red" />
          <p className="font-mono text-sm uppercase tracking-widest text-white/50">
            Loading stats...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="font-body text-sm text-red/80">{error}</p>
        <button
          type="button"
          onClick={loadStats}
          className="mt-4 rounded border border-white/10 bg-white/5 px-4 py-2 font-mono text-xs uppercase tracking-wider text-white/50 transition-colors hover:bg-white/10 hover:text-white/70"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const cards: StatCard[] = [
    { label: 'Total Applications', value: stats.total, color: '#F5F2ED' },
    {
      label: 'Pending',
      value: stats.by_status.pending ?? 0,
      color: '#C9A84C',
    },
    {
      label: 'Accepted',
      value: stats.by_status.accepted ?? 0,
      color: '#00ff88',
    },
    {
      label: 'Overflow',
      value: stats.by_status.accepted_overflow ?? 0,
      color: '#C9A84C',
    },
    {
      label: 'Rejected',
      value: stats.by_status.rejected ?? 0,
      color: '#C41E3A',
    },
    {
      label: 'Waitlisted',
      value: stats.by_status.waitlisted ?? 0,
      color: '#C9A84C',
    },
    { label: 'Teams Formed', value: stats.teams_count, color: '#F5F2ED' },
    { label: 'Emails Sent', value: stats.emails_sent, color: '#F5F2ED' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
            // system overview
          </p>
          <button
            type="button"
            onClick={loadStats}
            className="rounded border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-white/50 transition-colors hover:bg-white/10 hover:text-white/70"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {cards.map((card) => (
            <StatCardItem
              key={card.label}
              label={card.label}
              value={card.value}
              color={card.color}
            />
          ))}
        </div>
      </div>

      {/* Acceptance Emails Quick Action */}
      <div className="rounded-lg border border-white/10 bg-black-card p-6">
        <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
          // pending_acceptance_emails
        </p>
        <p className="mb-5 font-body text-sm leading-relaxed text-white/50">
          Send acceptance emails to approved applicants who haven't received
          them yet.
        </p>

        <button
          type="button"
          disabled={isAccepting}
          onClick={handleSendAcceptance}
          className="rounded border border-red/50 bg-red/10 px-5 py-2.5 font-body text-sm font-semibold text-red transition-colors hover:bg-red/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isAccepting ? 'Sending...' : 'Send Acceptance Emails'}
        </button>

        {/* Accept error */}
        {acceptError && (
          <div className="mt-4 rounded border border-red/30 bg-red/10 px-4 py-3 font-body text-sm text-red-200">
            {acceptError}
          </div>
        )}

        {/* Accept result */}
        {acceptResult && (
          <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-[#00ff88]" />
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#00ff88]">
                Acceptance Emails Sent
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Sent
                </p>
                <p className="font-mono text-2xl font-bold text-[#00ff88]">
                  {acceptResult.sent}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Errors
                </p>
                <p className="font-mono text-2xl font-bold text-red">
                  {acceptResult.errors}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Total
                </p>
                <p className="font-mono text-2xl font-bold text-white">
                  {acceptResult.total}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
