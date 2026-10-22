import { Search } from 'lucide-react';
import type { StatusFilter } from './types';

export function RosterFilters({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
  totalRows,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterStatus: StatusFilter;
  onFilterChange: (value: StatusFilter) => void;
  totalRows: number;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-ink-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-ink-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search by student name or matric..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-10 pl-9 pr-3 rounded-xl border border-ink-200 bg-canvas text-xs focus:ring-2 focus:ring-solar-500 focus:bg-surface focus:outline-none transition-all"
        />
      </div>

      <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
        <button
          onClick={() => onFilterChange('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filterStatus === 'ALL' ? 'bg-ink-950 text-white' : 'text-ink-600 hover:bg-canvas'
          }`}
        >
          All ({totalRows})
        </button>
        <button
          onClick={() => onFilterChange('GRADUATE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filterStatus === 'GRADUATE'
              ? 'bg-status-graduate-bg text-status-graduate-text border border-status-graduate-dot/30'
              : 'text-ink-600 hover:bg-canvas'
          }`}
        >
          Graduates
        </button>
        <button
          onClick={() => onFilterChange('PENDING')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filterStatus === 'PENDING'
              ? 'bg-status-pending-bg text-status-pending-text border border-status-pending-dot/30'
              : 'text-ink-600 hover:bg-canvas'
          }`}
        >
          Pending
        </button>
      </div>
    </div>
  );
}
