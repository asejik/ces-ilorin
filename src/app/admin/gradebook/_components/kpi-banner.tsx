import type { CohortFilter, GradebookKpis } from './types';

export function KpiBanner({
  selectedCohort,
  onSelectCohort,
  kpis,
}: {
  selectedCohort: CohortFilter;
  onSelectCohort: (cohort: CohortFilter) => void;
  kpis: GradebookKpis | null;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Active Cohort Switcher */}
      <div className="bg-surface rounded-2xl border border-ink-200 p-4 shadow-xs flex flex-col justify-between">
        <span className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-2">
          Select Cohort
        </span>
        <div className="grid grid-cols-2 gap-1.5 bg-canvas p-1 rounded-xl border border-ink-200">
          <button
            type="button"
            onClick={() => onSelectCohort('Regular')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedCohort === 'Regular'
                ? 'bg-surface text-ink-950 shadow-xs border border-ink-200'
                : 'text-ink-600 hover:text-ink-950'
            }`}
          >
            Regular
          </button>
          <button
            type="button"
            onClick={() => onSelectCohort('Sunday Cohort')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedCohort === 'Sunday Cohort'
                ? 'bg-sunday-500 text-white shadow-xs'
                : 'text-ink-600 hover:text-sunday-600'
            }`}
          >
            Sunday
          </button>
        </div>
      </div>

      {/* Enrolled Students */}
      <div className="bg-surface rounded-2xl border border-ink-200 p-4 shadow-xs">
        <span className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1">
          Enrolled Students
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-heading font-extrabold text-2xl text-ink-950">
            {kpis?.totalStudents ?? 0}
          </span>
          <span className="text-xs text-ink-500">Registered</span>
        </div>
        <span className="text-[11px] text-ink-400 mt-1 block">Active matriculated students</span>
      </div>

      {/* Cleared Graduates */}
      <div className="bg-surface rounded-2xl border border-ink-200 p-4 shadow-xs">
        <span className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1">
          Cleared for Graduation
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-heading font-extrabold text-2xl text-status-graduate-dot">
            {kpis?.graduatesCount ?? 0}
          </span>
          <span className="text-xs text-ink-500">Graduates</span>
        </div>
        <span className="text-[11px] text-ink-400 mt-1 block">Total ≥ 50 & 100% Attendance</span>
      </div>

      {/* Pending Clearance */}
      <div className="bg-surface rounded-2xl border border-ink-200 p-4 shadow-xs">
        <span className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1">
          Pending Evaluation
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-heading font-extrabold text-2xl text-status-pending-text">
            {kpis?.pendingCount ?? 0}
          </span>
          <span className="text-xs text-ink-500">Incomplete</span>
        </div>
        <span className="text-[11px] text-ink-400 mt-1 block">Missing quizzes or exam</span>
      </div>
    </div>
  );
}
