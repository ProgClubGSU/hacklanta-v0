import { useAuth } from '@clerk/astro/react';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch, type PaginatedResponse } from '../../lib/api';
import type { ApplicationData } from '../dashboard/ApplicationForm';

interface Props {
  onSelect?: (application: ApplicationData) => void;
  onBulkUpdate?: () => void;
}

const STATUS_OPTIONS = ['all', 'pending', 'accepted', 'rejected', 'waitlisted'];
const EXPERIENCE_OPTIONS = ['all', 'beginner', 'intermediate', 'advanced'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-gold',
  accepted: 'text-gold',
  rejected: 'text-suit-red',
  waitlisted: 'text-teal-light',
};

type SortField = 'created_at' | 'university' | 'major' | 'status' | 'year_of_study' | 'experience_level';

export default function ApplicantTable({ onSelect, onBulkUpdate }: Props) {
  const { getToken } = useAuth();
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams({ page: String(page), page_size: '15' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (experienceFilter !== 'all') params.set('experience', experienceFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (sortBy) params.set('sort_by', sortBy);
      if (sortOrder) params.set('sort_order', sortOrder);

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
  }, [getToken, page, statusFilter, experienceFilter, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
    setSelectedIds(new Set());
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(applications.map((app) => app.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkAction = async (status: 'accepted' | 'rejected' | 'waitlisted') => {
    if (selectedIds.size === 0) return;

    setBulkActionLoading(true);
    try {
      const token = await getToken();
      await apiFetch(
        '/api/v1/applications/bulk',
        {
          method: 'POST',
          body: JSON.stringify({
            application_ids: Array.from(selectedIds),
            status,
          }),
        },
        token,
      );
      setSelectedIds(new Set());
      await fetchApplications();
      onBulkUpdate?.();
    } catch (err) {
      console.error('Bulk action failed:', err);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleQuickAction = async (appId: string, status: 'accepted' | 'rejected' | 'waitlisted') => {
    try {
      const token = await getToken();
      await apiFetch(
        `/api/v1/applications/${appId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        },
        token,
      );
      await fetchApplications();
      onBulkUpdate?.();
    } catch (err) {
      console.error('Quick action failed:', err);
    }
  };

  const allSelected = applications.length > 0 && selectedIds.size === applications.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < applications.length;

  return (
    <div className="mt-6">
      {/* Search and Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by university, major, email, phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full border border-base-border bg-base-dark px-3 py-2 font-mono text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-neon-green"
            />
          </div>
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
            {total} applicant{total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 border border-neon-green/30 bg-neon-green/5 px-4 py-2">
            <span className="font-mono text-sm text-neon-green">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => handleBulkAction('accepted')}
              disabled={bulkActionLoading}
              className="border border-neon-green bg-neon-green/10 px-3 py-1 font-mono text-xs text-neon-green transition-colors hover:bg-neon-green/20 disabled:opacity-50"
            >
              Accept
            </button>
            <button
              onClick={() => handleBulkAction('waitlisted')}
              disabled={bulkActionLoading}
              className="border border-cyan bg-cyan/10 px-3 py-1 font-mono text-xs text-cyan transition-colors hover:bg-cyan/20 disabled:opacity-50"
            >
              Waitlist
            </button>
            <button
              onClick={() => handleBulkAction('rejected')}
              disabled={bulkActionLoading}
              className="border border-suit-red bg-suit-red/10 px-3 py-1 font-mono text-xs text-suit-red transition-colors hover:bg-suit-red/20 disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto font-mono text-xs text-text-muted hover:text-text-primary"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border border-base-border bg-base-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-sm">
            <thead>
              <tr className="border-b border-base-border bg-base-dark text-xs tracking-wider text-text-muted">
                <th className="px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="cursor-pointer accent-neon-green"
                  />
                </th>
                <SortHeader
                  label="University"
                  field="university"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Major"
                  field="major"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <SortHeader
                  label="Year"
                  field="year_of_study"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Experience"
                  field="experience_level"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Status"
                  field="status"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortHeader
                  label="Date"
                  field="created_at"
                  currentSort={sortBy}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-text-muted">
                    // loading...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-text-muted">
                    // no applications found
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-base-border transition-colors hover:bg-base-dark/50"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(app.id)}
                        onChange={(e) => handleSelectOne(app.id, e.target.checked)}
                        className="cursor-pointer accent-neon-green"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td
                      className="px-4 py-3 text-text-primary cursor-pointer"
                      onClick={() => onSelect?.(app)}
                    >
                      {app.university}
                    </td>
                    <td
                      className="px-4 py-3 text-text-secondary cursor-pointer"
                      onClick={() => onSelect?.(app)}
                    >
                      {app.major}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">
                      {app.phone_number || '—'}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">
                      {app.email ? app.email.length > 20 ? app.email.slice(0, 20) + '...' : app.email : '—'}
                    </td>
                    <td
                      className="px-4 py-3 text-text-secondary cursor-pointer"
                      onClick={() => onSelect?.(app)}
                    >
                      {app.year_of_study}
                    </td>
                    <td
                      className="px-4 py-3 text-text-secondary cursor-pointer"
                      onClick={() => onSelect?.(app)}
                    >
                      {app.experience_level ?? '—'}
                    </td>
                    <td
                      className={`px-4 py-3 font-bold cursor-pointer ${STATUS_COLORS[app.status] ?? 'text-text-secondary'}`}
                      onClick={() => onSelect?.(app)}
                    >
                      {app.status.toUpperCase()}
                    </td>
                    <td
                      className="px-4 py-3 text-text-muted cursor-pointer"
                      onClick={() => onSelect?.(app)}
                    >
                      {new Date(app.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {app.status !== 'accepted' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAction(app.id, 'accepted');
                            }}
                            className="border border-neon-green/30 bg-neon-green/10 px-2 py-1 text-xs text-neon-green transition-colors hover:bg-neon-green/20"
                            title="Accept"
                          >
                            ✓
                          </button>
                        )}
                        {app.status !== 'rejected' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAction(app.id, 'rejected');
                            }}
                            className="border border-suit-red/30 bg-suit-red/10 px-2 py-1 text-xs text-suit-red transition-colors hover:bg-suit-red/20"
                            title="Reject"
                          >
                            ✗
                          </button>
                        )}
                      </div>
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
              className="font-mono text-xs text-text-secondary transition-colors hover:text-gold disabled:opacity-30"
            >
              {'<'} prev
            </button>
            <span className="font-mono text-xs text-text-muted">
              page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="font-mono text-xs text-text-secondary transition-colors hover:text-gold disabled:opacity-30"
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
        className="border border-base-border bg-base-dark px-2 py-1 font-mono text-xs text-text-primary outline-none focus:border-gold"
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

function SortHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
}: {
  label: string;
  field: SortField;
  currentSort: SortField;
  currentOrder: 'asc' | 'desc';
  onSort: (field: SortField) => void;
}) {
  const isActive = currentSort === field;
  return (
    <th
      className="px-4 py-3 cursor-pointer select-none hover:text-neon-green transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {isActive && (
          <span className="text-neon-green">
            {currentOrder === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );
}
