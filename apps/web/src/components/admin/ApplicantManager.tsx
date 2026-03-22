import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApi, type Application, type ApplicationsResponse } from '../../lib/admin-api';
import ApplicantTable from './ApplicantTable';
import BulkActionBar from './BulkActionBar';
import ApplicantDetailModal from './ApplicantDetailModal';

const PAGE_SIZE = 25;

const STATUS_PILLS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'accepted_overflow', label: 'Overflow' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'waitlisted', label: 'Waitlisted' },
];

export default function ApplicantManager() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [meta, setMeta] = useState<{ total: number; offset: number; limit: number }>({
    total: 0,
    offset: 0,
    limit: PAGE_SIZE,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & sorting
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0); // offset

  // Selection & detail
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailApp, setDetailApp] = useState<Application | null>(null);

  // Debounce search input
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(0);
    }, 300);
  };

  // Load applications
  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result: ApplicationsResponse = await adminApi.getApplications({
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
        offset: page,
        limit: PAGE_SIZE,
      });
      setApplications(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, sortBy, sortDir, page]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Sort handler
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
    setPage(0);
  };

  // Status filter handler — toggle individual statuses
  const handleStatusFilter = (value: string) => {
    if (value === '') {
      // "All" clears filter
      setStatusFilter('');
    } else if (statusFilter === '') {
      // No filter active, set single
      setStatusFilter(value);
    } else {
      const current = statusFilter.split(',');
      if (current.includes(value)) {
        const next = current.filter((s) => s !== value);
        setStatusFilter(next.join(','));
      } else {
        setStatusFilter([...current, value].join(','));
      }
    }
    setPage(0);
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    const allCurrentIds = applications.map((a) => a.id);
    const allSelected = allCurrentIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allCurrentIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allCurrentIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk status update
  const handleBulkUpdateStatus = async (newStatus: string, sendEmail: boolean) => {
    await adminApi.updateStatus({
      application_ids: Array.from(selectedIds),
      new_status: newStatus,
      send_email: sendEmail,
    });
    await loadApplications();
  };

  // Single status update (from detail modal)
  const handleSingleStatusChange = async (appId: string, newStatus: string, sendEmail: boolean) => {
    await adminApi.updateStatus({
      application_ids: [appId],
      new_status: newStatus,
      send_email: sendEmail,
    });
    await loadApplications();
  };

  // Page change
  const handlePageChange = (newOffset: number) => {
    setPage(newOffset);
  };

  // Check if a status pill is active
  const isStatusActive = (value: string) => {
    if (value === '') return statusFilter === '';
    if (statusFilter === '') return false;
    return statusFilter.split(',').includes(value);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search applicants..."
            className="w-full rounded border border-white/10 bg-black/40 py-2.5 pl-10 pr-4 font-mono text-sm text-white placeholder:text-white/30 focus:border-red focus:outline-none"
          />
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap gap-2">
          {STATUS_PILLS.map((pill) => {
            const active = isStatusActive(pill.value);
            return (
              <button
                key={pill.value}
                onClick={() => handleStatusFilter(pill.value)}
                className={`rounded border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                  active
                    ? 'border-red/40 bg-red/20 text-red'
                    : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded border border-red-bright/30 bg-red-bright/10 px-4 py-3 font-mono text-sm text-red-bright">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-red/20 border-t-red" />
            <p className="font-mono text-sm uppercase tracking-widest text-white/40">Loading applications...</p>
          </div>
        </div>
      ) : (
        <ApplicantTable
          applications={applications}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          onRowClick={setDetailApp}
          total={meta.total}
          offset={meta.offset}
          limit={meta.limit}
          onPageChange={handlePageChange}
        />
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onUpdateStatus={handleBulkUpdateStatus}
          onClearSelection={handleClearSelection}
        />
      )}

      {/* Detail modal */}
      {detailApp && (
        <ApplicantDetailModal
          application={detailApp}
          onClose={() => setDetailApp(null)}
          onStatusChange={handleSingleStatusChange}
        />
      )}
    </div>
  );
}
