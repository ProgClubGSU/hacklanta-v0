import { useAuth } from '@clerk/astro/react';
import { useEffect, useState } from 'react';
import { apiFetch, type PaginatedResponse } from '../../lib/api';
import type { ApplicationData } from '../dashboard/ApplicationForm';

interface StatCounts {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  waitlisted: number;
}

export default function StatsOverview() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<StatCounts>({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    waitlisted: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getToken();
        // Fetch first page to get total, then derive counts from filtered queries
        const [all, pending, accepted, rejected, waitlisted] = await Promise.all([
          apiFetch<PaginatedResponse<ApplicationData>>('/api/v1/applications?page_size=1', {}, token),
          apiFetch<PaginatedResponse<ApplicationData>>('/api/v1/applications?page_size=1&status=pending', {}, token),
          apiFetch<PaginatedResponse<ApplicationData>>('/api/v1/applications?page_size=1&status=accepted', {}, token),
          apiFetch<PaginatedResponse<ApplicationData>>('/api/v1/applications?page_size=1&status=rejected', {}, token),
          apiFetch<PaginatedResponse<ApplicationData>>('/api/v1/applications?page_size=1&status=waitlisted', {}, token),
        ]);
        setStats({
          total: all.meta.total,
          pending: pending.meta.total,
          accepted: accepted.meta.total,
          rejected: rejected.meta.total,
          waitlisted: waitlisted.meta.total,
        });
      } catch {
        // silently fail — stats are non-critical
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [getToken]);

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard label="TOTAL" value={stats.total} color="text-text-primary" loading={loading} />
      <StatCard label="PENDING" value={stats.pending} color="text-gold" loading={loading} />
      <StatCard label="ACCEPTED" value={stats.accepted} color="text-gold" loading={loading} />
      <StatCard label="WAITLISTED" value={stats.waitlisted} color="text-teal-light" loading={loading} />
      <StatCard label="REJECTED" value={stats.rejected} color="text-suit-red" loading={loading} />
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  loading,
}: {
  label: string;
  value: number;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="border border-base-border bg-base-card p-4">
      <p className="font-mono text-xs tracking-wider text-text-muted">{label}</p>
      <p className={`mt-1 font-mono text-3xl font-bold ${color}`}>
        {loading ? '—' : value}
      </p>
    </div>
  );
}
