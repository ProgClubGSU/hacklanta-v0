import type { Application } from '../../lib/admin-api';

interface ApplicantTableProps {
  applications: Application[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSort: (column: string) => void;
  onRowClick: (app: Application) => void;
  total: number;
  offset: number;
  limit: number;
  onPageChange: (newOffset: number) => void;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'text-gold border-gold/30 bg-gold/10',
  accepted: 'text-[#00ff88] border-[#00ff88]/30 bg-[#00ff88]/10',
  accepted_overflow: 'text-gold border-gold/30 bg-gold/10',
  rejected: 'text-red-bright border-red-bright/30 bg-red-bright/10',
  waitlisted: 'text-gold border-gold/30 bg-gold/10',
};

interface SortableColumn {
  key: string;
  label: string;
  sortable: boolean;
}

const COLUMNS: SortableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'university', label: 'University', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'experience_level', label: 'Experience', sortable: true },
  { key: 'year_of_study', label: 'Year', sortable: true },
  { key: 'created_at', label: 'Applied', sortable: true },
];

function SortArrow({ column, sortBy, sortDir }: { column: string; sortBy: string; sortDir: 'asc' | 'desc' }) {
  if (sortBy !== column) {
    return <span className="ml-1 text-white/15">&uarr;</span>;
  }
  return <span className="ml-1 text-red">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>;
}

export default function ApplicantTable({
  applications,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  sortBy,
  sortDir,
  onSort,
  onRowClick,
  total,
  offset,
  limit,
  onPageChange,
}: ApplicantTableProps) {
  const allSelected = applications.length > 0 && applications.every((app) => selectedIds.has(app.id));
  const someSelected = applications.some((app) => selectedIds.has(app.id)) && !allSelected;

  const start = offset + 1;
  const end = Math.min(offset + limit, total);
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  if (applications.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-black-card/60 py-16 text-center">
        <p className="font-mono text-sm text-white/30">No applications found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-black-card/60">
      <div className="overflow-x-auto">
        <table className="w-full text-left font-body text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={onToggleSelectAll}
                  className="h-3.5 w-3.5 accent-red cursor-pointer"
                />
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 ${
                    col.sortable ? 'cursor-pointer select-none hover:text-white/60' : ''
                  }`}
                  onClick={col.sortable ? () => onSort(col.key) : undefined}
                >
                  {col.label}
                  {col.sortable && <SortArrow column={col.key} sortBy={sortBy} sortDir={sortDir} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => {
              const isSelected = selectedIds.has(app.id);
              const userName = app.user
                ? `${app.user.first_name ?? ''} ${app.user.last_name ?? ''}`.trim() || app.user.email
                : null;
              const email = app.user?.email ?? app.email;
              const statusStyle = STATUS_STYLES[app.status] ?? 'text-white/50 border-white/20 bg-white/5';
              const statusLabel = app.status === 'accepted_overflow' ? 'overflow' : app.status;

              return (
                <tr
                  key={app.id}
                  className={`border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 ${
                    isSelected ? 'bg-red/5' : ''
                  }`}
                  onClick={() => onRowClick(app)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(app.id)}
                      className="h-3.5 w-3.5 accent-red cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    {userName ? (
                      <span className="text-white/90">{userName}</span>
                    ) : (
                      <span className="text-white/30 italic">No linked user</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-white/60">{email}</td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-white/60">{app.university}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${statusStyle}`}
                    >
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/50">{app.experience_level ?? '\u2014'}</td>
                  <td className="px-4 py-3 text-white/50">{app.year_of_study}</td>
                  <td className="px-4 py-3 font-mono text-xs text-white/40">{timeAgo(app.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
        <span className="font-mono text-[11px] text-white/40">
          Showing {start}&ndash;{end} of {total}
        </span>
        <div className="flex gap-2">
          <button
            disabled={!hasPrev}
            onClick={() => onPageChange(Math.max(0, offset - limit))}
            className="rounded border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] text-white/50 transition-colors hover:bg-white/10 hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Prev
          </button>
          <button
            disabled={!hasNext}
            onClick={() => onPageChange(offset + limit)}
            className="rounded border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] text-white/50 transition-colors hover:bg-white/10 hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
