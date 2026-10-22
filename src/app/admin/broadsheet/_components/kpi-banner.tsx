import { Award, CheckCircle2, Clock } from 'lucide-react';
import type { BroadsheetKPIs } from '@/types/broadsheet';
import type { CohortFilter } from './types';

export function KpiBanner({
  selectedCohort,
  onSelectCohort,
  kpis,
}: {
  selectedCohort: CohortFilter;
  onSelectCohort: (cohort: CohortFilter) => void;
  kpis: BroadsheetKPIs | null;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
      {/* Cohort Switcher */}
      <div className="bg-surface rounded-2xl border border-ink-200 p-3 sm:p-4 shadow-xs col-span-2 flex flex-col justify-between">
        <span className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1.5">
          Select Cohort
        </span>
        <div className="grid grid-cols-2 gap-1.5 bg-canvas p-1 rounded-xl border border-ink-200">
          <button
            type="button"
            onClick={() => onSelectCohort('Regular')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedCohort === 'Regular'
                ? 'bg-surface text-ink-950 shadow-xs'
                : 'text-ink-600 hover:text-ink-950'
            }`}
          >
            Regular Cohort
          </button>
          <button
            type="button"
            onClick={() => onSelectCohort('Sunday Cohort')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedCohort === 'Sunday Cohort'
                ? 'bg-solar-600 text-white shadow-xs'
                : 'text-ink-600 hover:text-ink-950'
            }`}
          >
            Sunday Cohort
          </button>
        </div>
      </div>

      {/* KPI: Cleared Graduates */}
      <div className="bg-surface rounded-2xl border border-ink-200 p-3 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">Graduates</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-heading font-black text-ink-950">
            {kpis?.graduatesCount ?? 0}
          </span>
          <span className="text-xs font-semibold text-emerald-600">
            / {kpis?.totalStudents ?? 0}
          </span>
        </div>
        <span className="text-[11px] text-ink-400 mt-1 block">
          {kpis && kpis.totalStudents > 0
            ? `${Math.round((kpis.graduatesCount / kpis.totalStudents) * 100)}% clearance rate`
            : '0% clearance'}
        </span>
      </div>

      {/* KPI: Pending */}
      <div className="bg-surface rounded-2xl border border-ink-200 p-3 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">Pending</span>
          <Clock className="w-4 h-4 text-amber-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-heading font-black text-amber-600">
            {kpis?.pendingCount ?? 0}
          </span>
          <span className="text-xs font-semibold text-ink-400">awaiting</span>
        </div>
        <span className="text-[11px] text-ink-400 mt-1 block">Quizzes or class attendance</span>
      </div>

      {/* KPI: Average Score */}
      <div className="bg-surface rounded-2xl border border-ink-200 p-3 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">Cohort Avg</span>
          <Award className="w-4 h-4 text-solar-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-heading font-black text-ink-950">
            {kpis?.averageScore ?? 0}
          </span>
          <span className="text-xs font-semibold text-ink-400">/ 100</span>
        </div>
        <span className="text-[11px] text-ink-400 mt-1 block">Cumulative composite</span>
      </div>

      {/* KPI: Distinctions & Merits */}
      <div className="bg-surface rounded-2xl border border-ink-200 p-3 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">Honours</span>
          <span className="text-xs font-bold text-solar-600">≥ 75%</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-heading font-black text-ink-950">
            {(kpis?.distinctionCount ?? 0) + (kpis?.meritCount ?? 0)}
          </span>
          <span className="text-[11px] font-semibold text-ink-500">
            ({kpis?.distinctionCount ?? 0} Dist)
          </span>
        </div>
        <span className="text-[11px] text-ink-400 mt-1 block">Distinctions & Merits</span>
      </div>
    </div>
  );
}
