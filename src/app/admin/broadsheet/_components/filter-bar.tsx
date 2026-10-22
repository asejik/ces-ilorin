import { Search } from 'lucide-react';
import type { BroadsheetKPIs } from '@/types/broadsheet';
import type { StatusFilter } from './types';

function FilterTab({
  active,
  activeClass,
  onClick,
  children,
}: {
  active: boolean;
  activeClass: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
        active ? activeClass : 'bg-canvas text-ink-600 hover:text-ink-950'
      }`}
    >
      {children}
    </button>
  );
}

export function FilterBar({
  filterStatus,
  onFilterChange,
  searchQuery,
  onSearchChange,
  totalRows,
  kpis,
}: {
  filterStatus: StatusFilter;
  onFilterChange: (value: StatusFilter) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  totalRows: number;
  kpis: BroadsheetKPIs | null;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-ink-200 p-4 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <FilterTab active={filterStatus === 'ALL'} activeClass="bg-ink-950 text-white" onClick={() => onFilterChange('ALL')}>
            All Candidates ({totalRows})
          </FilterTab>
          <FilterTab active={filterStatus === 'GRADUATE'} activeClass="bg-emerald-600 text-white" onClick={() => onFilterChange('GRADUATE')}>
            Graduates ({kpis?.graduatesCount ?? 0})
          </FilterTab>
          <FilterTab active={filterStatus === 'PENDING'} activeClass="bg-amber-600 text-white" onClick={() => onFilterChange('PENDING')}>
            Pending ({kpis?.pendingCount ?? 0})
          </FilterTab>
          <FilterTab active={filterStatus === 'HONOURS'} activeClass="bg-solar-600 text-white" onClick={() => onFilterChange('HONOURS')}>
            Honours ({(kpis?.distinctionCount ?? 0) + (kpis?.meritCount ?? 0)})
          </FilterTab>
          <FilterTab active={filterStatus === 'NOT_YET'} activeClass="bg-red-600 text-white" onClick={() => onFilterChange('NOT_YET')}>
            Not Yet ({kpis?.notYetCount ?? 0})
          </FilterTab>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search candidate or matric no..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-ink-200 bg-canvas text-xs text-ink-900 focus:outline-hidden focus:ring-2 focus:ring-solar-500/20 focus:border-solar-500"
          />
        </div>
      </div>
    </div>
  );
}
