import { useAuth } from '@clerk/astro/react';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch, type PaginatedResponse } from '../../lib/api';
import type { ApplicationData } from '../dashboard/ApplicationForm';

interface Props {
  onSelect?: (application: ApplicationData) => void;
}

const STATUS_OPTIONS = ['all', 'pending', 'accepted', 'rejected', 'waitlisted'];
const EXPERIENCE_OPTIONS = ['all', 'beginner', 'intermediate', 'advanced'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-gold',
  accepted: 'text-neon-green',
  rejected: 'text-suit-red',
  waitlisted: 'text-cyan',
};

export default function ApplicantTable({ onSelect }: Props) {
  const { getToken } = useAuth();
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams({ page: String(page), page_size: '15' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (experienceFilter !== 'all') params.set('experience', experienceFilter);

      const res = await apiFetch<PaginatedResponse<ApplicationData>>(
        `/api/v1/applications?${params}`,
        {},
        token,
      );
      setApplications(res.data);
      setTotalPages(res.meta.total_pages);
      setTotal(res.meta.total);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [getToken, page, statusFilter, experienceFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="mt-6">
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <FilterSelect
          label="Status"
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={handleFilterChange(setStatusFilter)}
        />
        <FilterSelect
          label="Experience"
          value={experienceFilter}
          options={EXPERIENCE_OPTIONS}
          onChange={handleFilterChange(setExperienceFilter)}
        />
        <span className="ml-auto font-mono text-xs text-text-muted">
          {total} applicant{total !== 1 ? 's' : ''} total
        </span>
      </div>

      {/* Table */}
      <div className="border border-base-border bg-base-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-sm">
            <thead>
              <tr className="border-b border-base-border bg-base-dark text-xs tracking-wider text-text-muted">
                <th className="px-4 py-3">University</th>
                <th className="px-4 py-3">Major</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Experience</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                    // loading...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                    // no applications found
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => onSelect?.(app)}
                    className="cursor-pointer border-b border-base-border transition-colors hover:bg-base-dark/50"
                  >
                    <td className="px-4 py-3 text-text-primary">{app.university}</td>
                    <td className="px-4 py-3 text-text-secondary">{app.major}</td>
                    <td className="px-4 py-3 text-text-secondary">{app.year_of_study}</td>
                    <td className="px-4 py-3 text-text-secondary">{app.experience_level ?? '—'}</td>
                    <td className={`px-4 py-3 font-bold ${STATUS_COLORS[app.status] ?? 'text-text-secondary'}`}>
                      {app.status.toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {new Date(app.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-base-border bg-base-dark px-4 py-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="font-mono text-xs text-text-secondary transition-colors hover:text-neon-green disabled:opacity-30"
            >
              {'<'} prev
            </button>
            <span className="font-mono text-xs text-text-muted">
              page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="font-mono text-xs text-text-secondary transition-colors hover:text-neon-green disabled:opacity-30"
            >
              next {'>'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-text-muted">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-base-border bg-base-dark px-2 py-1 font-mono text-xs text-text-primary outline-none focus:border-neon-green"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
