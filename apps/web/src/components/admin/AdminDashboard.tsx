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

export default function AdminDashboard() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<StatCounts>({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    waitlisted: 0,
  });
  const [recentApps, setRecentApps] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();

        // Fetch stats and recent applications in parallel
        const [all, pending, accepted, rejected, waitlisted, recent] = await Promise.all([
          apiFetch<PaginatedResponse<ApplicationData>>('/api/v1/applications?page_size=1', {}, token),
          apiFetch<PaginatedResponse<ApplicationData>>('/api/v1/applications?page_size=1&status=pending', {}, token),
          apiFetch<PaginatedResponse<ApplicationData>>('/api/v1/applications?page_size=1&status=accepted', {}, token),
          apiFetch<PaginatedResponse<ApplicationData>>('/api/v1/applications?page_size=1&status=rejected', {}, token),
          apiFetch<PaginatedResponse<ApplicationData>>('/api/v1/applications?page_size=1&status=waitlisted', {}, token),
          apiFetch<PaginatedResponse<ApplicationData>>('/api/v1/applications?page_size=5&sort_by=created_at&sort_order=desc', {}, token),
        ]);

        setStats({
          total: all.meta.total,
          pending: pending.meta.total,
          accepted: accepted.meta.total,
          rejected: rejected.meta.total,
          waitlisted: waitlisted.meta.total,
        });
        setRecentApps(recent.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getToken]);

  const acceptanceRate = stats.total > 0 ? ((stats.accepted / stats.total) * 100).toFixed(1) : '0.0';
  const reviewRate = stats.total > 0 ? (((stats.total - stats.pending) / stats.total) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <section>
        <h2 className="mb-4 font-mono text-sm tracking-wider text-text-muted">// KEY METRICS</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="TOTAL APPS"
            value={stats.total}
            color="text-text-primary"
            loading={loading}
            icon="📊"
          />
          <StatCard
            label="PENDING"
            value={stats.pending}
            color="text-gold"
            loading={loading}
            icon="⏳"
          />
          <StatCard
            label="ACCEPTED"
            value={stats.accepted}
            color="text-neon-green"
            loading={loading}
            icon="✓"
          />
          <StatCard
            label="WAITLISTED"
            value={stats.waitlisted}
            color="text-cyan"
            loading={loading}
            icon="⏸"
          />
          <StatCard
            label="REJECTED"
            value={stats.rejected}
            color="text-suit-red"
            loading={loading}
            icon="✗"
          />
        </div>
      </section>

      {/* Secondary Stats */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border border-base-border bg-base-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs tracking-wider text-text-muted">ACCEPTANCE RATE</p>
                <p className="mt-2 font-mono text-4xl font-bold text-neon-green">
                  {loading ? '—' : `${acceptanceRate}%`}
                </p>
                <p className="mt-1 font-mono text-xs text-text-muted">
                  {stats.accepted} / {stats.total} accepted
                </p>
              </div>
              <div className="text-3xl">🎯</div>
            </div>
          </div>
          <div className="border border-base-border bg-base-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs tracking-wider text-text-muted">REVIEW PROGRESS</p>
                <p className="mt-2 font-mono text-4xl font-bold text-cyan">
                  {loading ? '—' : `${reviewRate}%`}
                </p>
                <p className="mt-1 font-mono text-xs text-text-muted">
                  {stats.total - stats.pending} / {stats.total} reviewed
                </p>
              </div>
              <div className="text-3xl">⚡</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-4 font-mono text-sm tracking-wider text-text-muted">// QUICK ACTIONS</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ActionCard
            title="Review Applicants"
            description="Review and manage all applications"
            href="/admin/applicants"
            icon="👤"
            badge={stats.pending > 0 ? `${stats.pending} pending` : undefined}
            badgeColor="text-gold"
          />
          <ActionCard
            title="Manage Contestants"
            description="View accepted contestants"
            href="/admin/contestants"
            icon="🎫"
            badge={stats.accepted > 0 ? `${stats.accepted} total` : undefined}
            badgeColor="text-neon-green"
          />
          <ActionCard
            title="Send Announcement"
            description="Broadcast to all contestants"
            href="/admin/announcements"
            icon="📢"
          />
          <ActionCard
            title="Email Composer"
            description="Send mass emails to groups"
            href="/admin/emails"
            icon="📧"
          />
        </div>
      </section>

      {/* Recent Applications */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-sm tracking-wider text-text-muted">// RECENT APPLICATIONS</h2>
          <a
            href="/admin/applicants"
            className="font-mono text-xs text-neon-green transition-colors hover:text-neon-green-dim"
          >
            View all →
          </a>
        </div>
        <div className="border border-base-border bg-base-card">
          {loading ? (
            <div className="px-6 py-12 text-center font-mono text-sm text-text-muted">
              // loading recent applications...
            </div>
          ) : recentApps.length === 0 ? (
            <div className="px-6 py-12 text-center font-mono text-sm text-text-muted">
              // no applications yet
            </div>
          ) : (
            <div className="divide-y divide-base-border">
              {recentApps.map((app) => (
                <RecentApplicationRow key={app.id} application={app} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  loading,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  loading: boolean;
  icon: string;
}) {
  return (
    <div className="border border-base-border bg-base-card p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono text-xs tracking-wider text-text-muted">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`font-mono text-3xl font-bold ${color}`}>
        {loading ? '—' : value}
      </p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  icon,
  badge,
  badgeColor = 'text-text-muted',
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <a
      href={href}
      className="group border border-base-border bg-base-card p-6 transition-all hover:border-neon-green hover:bg-base-dark"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        {badge && (
          <span className={`font-mono text-xs ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-mono text-sm font-bold text-text-primary transition-colors group-hover:text-neon-green">
        {title}
      </h3>
      <p className="mt-1 font-mono text-xs text-text-muted">
        {description}
      </p>
    </a>
  );
}

function RecentApplicationRow({ application }: { application: ApplicationData }) {
  const statusColors: Record<string, string> = {
    pending: 'text-gold border-gold/30 bg-gold/5',
    accepted: 'text-neon-green border-neon-green/30 bg-neon-green/5',
    rejected: 'text-suit-red border-suit-red/30 bg-suit-red/5',
    waitlisted: 'text-cyan border-cyan/30 bg-cyan/5',
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <a
      href={`/admin/applicants`}
      className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-base-dark/50"
    >
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <p className="font-mono text-sm font-bold text-text-primary">
            {application.university}
          </p>
          <span className="text-text-muted">•</span>
          <p className="font-mono text-sm text-text-secondary">
            {application.major}
          </p>
          <span className="text-text-muted">•</span>
          <p className="font-mono text-xs text-text-muted">
            {application.year_of_study}
          </p>
        </div>
        <p className="mt-1 font-mono text-xs text-text-muted">
          {application.email}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs text-text-muted">
          {timeAgo(application.created_at)}
        </span>
        <span className={`border px-3 py-1 font-mono text-xs font-bold ${statusColors[application.status] || 'text-text-muted border-base-border bg-base-dark'}`}>
          {application.status.toUpperCase()}
        </span>
      </div>
    </a>
  );
}
