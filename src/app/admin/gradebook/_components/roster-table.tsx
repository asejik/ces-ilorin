import type { StudentGradebookRow } from '@/actions/gradebook';
import { RosterRow, type OpenScoreOverride, type ToggleAttendance } from './roster-row';
import { QUIZ_COLUMNS } from './types';

export function RosterTable({
  loading,
  rows,
  onOpenScoreOverride,
  onToggleAttendance,
}: {
  loading: boolean;
  rows: StudentGradebookRow[];
  onOpenScoreOverride: OpenScoreOverride;
  onToggleAttendance: ToggleAttendance;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-ink-200 shadow-sm overflow-hidden">
      {loading ? (
        <div className="p-16 text-center text-xs text-ink-500 flex items-center justify-center gap-2">
          <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-solar-500 border-t-transparent" />
          <span>Compiling gradebook scores and clearance...</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="p-12 text-center text-xs text-ink-500">
          No student records match the selected cohort and search filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-canvas border-b border-ink-200 text-ink-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 sticky left-0 bg-canvas z-10">Student</th>
                <th className="py-3 px-2">Cohort</th>
                {QUIZ_COLUMNS.map((col) => (
                  <th key={col.code} className="py-3 px-2 text-center" title={col.name}>
                    {col.short} (/5)
                  </th>
                ))}
                <th className="py-3 px-2 text-center bg-ink-50/70 font-extrabold text-ink-950">
                  Quiz Total (/40)
                </th>
                <th className="py-3 px-2 text-center font-extrabold text-ink-950">Exam (/60)</th>
                <th className="py-3 px-2 text-center font-extrabold text-ink-950 bg-solar-50/60">
                  Total (/100)
                </th>
                <th className="py-3 px-2 text-center" title="Elementary Principles">
                  Elem Princ
                </th>
                <th className="py-3 px-2 text-center" title="Membership & Vision Class">
                  Memb Class
                </th>
                <th className="py-3 px-3 text-center">Clearance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {rows.map((row) => (
                <RosterRow
                  key={row.studentId}
                  row={row}
                  onOpenScoreOverride={onOpenScoreOverride}
                  onToggleAttendance={onToggleAttendance}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
