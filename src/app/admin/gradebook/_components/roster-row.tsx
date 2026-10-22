import type { StudentGradebookRow } from '@/actions/gradebook';
import { QUIZ_COLUMNS } from '@/lib/quiz-columns';

export type OpenScoreOverride = (
  student: StudentGradebookRow,
  quizId: string,
  courseTitle: string,
  currentScore: number | null,
  maxScore: number
) => void;

export type ToggleAttendance = (
  studentId: string,
  courseName: string,
  currentStatus: string | null
) => void;

function AttendanceCell({
  status,
  onToggle,
}: {
  status: string | null;
  onToggle: () => void;
}) {
  return (
    <td className="py-2.5 px-2 text-center">
      <button
        type="button"
        onClick={onToggle}
        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
          status === 'Attended'
            ? 'bg-status-graduate-bg text-status-graduate-text border border-status-graduate-dot/30'
            : status === 'Excused'
            ? 'bg-ink-100 text-ink-700'
            : status === 'Not Attended'
            ? 'bg-status-notyet-bg text-status-notyet-text'
            : 'bg-canvas text-ink-400 border border-ink-200'
        }`}
        title="Click to toggle attendance status"
      >
        {status || 'Unmarked'}
      </button>
    </td>
  );
}

export function RosterRow({
  row,
  onOpenScoreOverride,
  onToggleAttendance,
}: {
  row: StudentGradebookRow;
  onOpenScoreOverride: OpenScoreOverride;
  onToggleAttendance: ToggleAttendance;
}) {
  return (
    <tr className="hover:bg-canvas/50 transition-colors">
      {/* Student Info */}
      <td className="py-2.5 px-3 sticky left-0 bg-surface z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-ink-100 text-ink-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
            {row.fullName.charAt(0)}
          </div>
          <div>
            <span className="font-bold text-ink-950 block text-xs leading-tight">{row.fullName}</span>
            <span className="font-mono text-[11px] text-ink-500 leading-tight">{row.matricNo}</span>
          </div>
        </div>
      </td>

      {/* Cohort Badge */}
      <td className="py-2.5 px-2">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            row.cohortType === 'Sunday Cohort'
              ? 'bg-sunday-100 text-sunday-700 border border-sunday-300'
              : 'bg-ink-100 text-ink-800'
          }`}
        >
          {row.cohortType === 'Sunday Cohort' ? 'Sunday' : 'Regular'}
        </span>
      </td>

      {/* 8 Quiz Cells */}
      {QUIZ_COLUMNS.map((col) => {
        const q = row.quizzes[col.code];
        if (!q) {
          return (
            <td key={col.code} className="py-2.5 px-2 text-center text-ink-300">
              -
            </td>
          );
        }

        return (
          <td key={col.code} className="py-2.5 px-2 text-center">
            <button
              type="button"
              onClick={() => onOpenScoreOverride(row, q.quizId, col.name, q.score, q.maxScore)}
              className={`px-1.5 py-0.5 rounded font-mono font-bold text-xs inline-flex items-center gap-1 hover:ring-2 hover:ring-solar-400 transition-all ${
                q.score !== null
                  ? q.isOverride
                    ? 'bg-solar-100 text-solar-900 border border-solar-300'
                    : 'bg-ink-100 text-ink-950'
                  : 'text-ink-400 hover:bg-canvas'
              }`}
              title={
                q.isOverride
                  ? `Manually overridden: ${q.overrideReason || 'No reason provided'}`
                  : 'Click to edit or manually record score'
              }
            >
              <span>{q.score !== null ? q.score.toFixed(1) : '-'}</span>
              {q.isOverride && (
                <span className="text-[9px] text-solar-700 font-extrabold uppercase">M</span>
              )}
            </button>
          </td>
        );
      })}

      {/* Quiz Total */}
      <td className="py-2.5 px-2 text-center font-mono font-bold bg-ink-50/70 text-ink-950">
        {row.quizTotal !== null ? row.quizTotal.toFixed(1) : '-'}
      </td>

      {/* Final Exam */}
      <td className="py-2.5 px-2 text-center">
        {row.finalExam ? (
          <button
            type="button"
            onClick={() =>
              onOpenScoreOverride(
                row,
                row.finalExam!.quizId,
                'Final Examination',
                row.finalExam!.score,
                row.finalExam!.maxScore
              )
            }
            className={`px-2 py-0.5 rounded font-mono font-bold text-xs inline-flex items-center gap-1 hover:ring-2 hover:ring-solar-400 transition-all ${
              row.finalExam.score !== null
                ? row.finalExam.isOverride
                  ? 'bg-solar-100 text-solar-900 border border-solar-300'
                  : 'bg-ink-100 text-ink-950'
                : 'text-ink-400 hover:bg-canvas'
            }`}
          >
            <span>{row.finalExam.score !== null ? row.finalExam.score.toFixed(1) : '-'}</span>
            {row.finalExam.isOverride && (
              <span className="text-[9px] text-solar-700 font-extrabold uppercase">M</span>
            )}
          </button>
        ) : (
          '-'
        )}
      </td>

      {/* Cumulative Total */}
      <td className="py-2.5 px-2 text-center font-mono font-extrabold bg-solar-50/60 text-ink-950">
        {row.cumulativeTotal !== null ? (
          <span
            className={
              row.cumulativeTotal >= 85
                ? 'text-solar-800'
                : row.cumulativeTotal >= 50
                ? 'text-status-graduate-text'
                : 'text-status-notyet-dot'
            }
          >
            {row.cumulativeTotal.toFixed(1)}
          </span>
        ) : (
          '-'
        )}
      </td>

      {/* Attendance: Elementary Principles */}
      <AttendanceCell
        status={row.elementaryPrinciples}
        onToggle={() =>
          onToggleAttendance(row.studentId, 'Elementary Principles', row.elementaryPrinciples)
        }
      />

      {/* Attendance: Membership & Vision */}
      <AttendanceCell
        status={row.membershipVision}
        onToggle={() =>
          onToggleAttendance(row.studentId, 'Membership & Vision Class', row.membershipVision)
        }
      />

      {/* Graduation Clearance Status */}
      <td className="py-2.5 px-3 text-center">
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
            row.graduationStatus === '✅ GRADUATE'
              ? 'bg-status-graduate-bg text-status-graduate-text border border-status-graduate-dot/30'
              : row.graduationStatus === '⏳ PENDING'
              ? 'bg-status-pending-bg text-status-pending-text border border-status-pending-dot/30'
              : 'bg-status-notyet-bg text-status-notyet-text border border-status-notyet-dot/30'
          }`}
        >
          {row.graduationStatus}
        </span>
      </td>
    </tr>
  );
}
