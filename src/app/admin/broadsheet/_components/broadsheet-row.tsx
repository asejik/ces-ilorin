import { Award, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { getHonourBadgeDetails } from '@/lib/certificate';
import { QUIZ_COLUMNS } from '@/lib/quiz-columns';
import type { CertificateDetails, StudentBroadsheetRow } from '@/types/broadsheet';

function AttendanceBadge({ status }: { status: string | null }) {
  return (
    <td className="py-3 px-2 text-center">
      {status === 'Attended' ? (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
          Attended
        </span>
      ) : (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
          {status ?? 'Pending'}
        </span>
      )}
    </td>
  );
}

export function BroadsheetRow({
  row,
  index,
  semesterName,
  issuingStudentId,
  onViewCertificate,
  onIssueCertificate,
}: {
  row: StudentBroadsheetRow;
  index: number;
  semesterName: string;
  issuingStudentId: string | null;
  onViewCertificate: (cert: CertificateDetails) => void;
  onIssueCertificate: (studentId: string) => void;
}) {
  const isGraduate = row.graduationStatus === '✅ GRADUATE';
  const isPending = row.graduationStatus === '⏳ PENDING';
  const hasCert = Boolean(row.certificateId);
  const honourBadge = getHonourBadgeDetails(row.honourClass);

  return (
    <tr className="hover:bg-canvas/60 transition-colors group">
      {/* Index */}
      <td className="py-3 px-3 text-center text-ink-400 font-mono text-[11px]">{index + 1}</td>

      {/* Candidate Identity */}
      <td className="py-3 px-3">
        <div className="flex items-center gap-2.5">
          {row.passportUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.passportUrl}
              alt={row.fullName}
              loading="lazy"
              decoding="async"
              className="w-8 h-8 rounded-lg object-cover border border-ink-200 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-surface-subtle border border-ink-200 flex items-center justify-center font-bold text-ink-600 text-xs shrink-0">
              {row.fullName.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <span className="font-bold text-ink-950 block truncate">{row.fullName}</span>
            <span className="font-mono text-[11px] text-ink-500 block truncate">{row.matricNo}</span>
          </div>
        </div>
      </td>

      {/* 8 Quiz Scores */}
      {QUIZ_COLUMNS.map((col) => {
        const qInfo = row.quizzes[col.code];
        const score = qInfo?.score;
        return (
          <td key={col.code} className="py-3 px-2 text-center font-mono text-xs">
            {score !== null && score !== undefined ? (
              <span className={qInfo?.isOverride ? 'text-amber-700 font-bold' : 'text-ink-800'}>
                {score.toFixed(1)}
                {qInfo?.isOverride && <span className="text-[10px] ml-0.5">M</span>}
              </span>
            ) : (
              <span className="text-ink-300">-</span>
            )}
          </td>
        );
      })}

      {/* Quiz Total */}
      <td className="py-3 px-2 text-center font-mono font-bold bg-solar-50/40 text-ink-900">
        {row.quizTotal !== null ? row.quizTotal.toFixed(1) : '-'}
      </td>

      {/* Final Exam */}
      <td className="py-3 px-2 text-center font-mono font-bold bg-solar-50/40 text-ink-900">
        {row.finalExam?.score !== null && row.finalExam?.score !== undefined
          ? row.finalExam.score.toFixed(1)
          : '-'}
      </td>

      {/* Cumulative Total */}
      <td className="py-3 px-2 text-center font-mono font-black bg-solar-100/40 text-ink-950 text-sm">
        {row.cumulativeTotal !== null ? (
          <span className={row.cumulativeTotal >= 50 ? 'text-emerald-700' : 'text-red-600'}>
            {row.cumulativeTotal.toFixed(1)}
          </span>
        ) : (
          <span className="text-ink-300">-</span>
        )}
      </td>

      {/* Elementary Principles / Membership & Vision */}
      <AttendanceBadge status={row.elementaryPrinciples} />
      <AttendanceBadge status={row.membershipVision} />

      {/* Clearance Status */}
      <td className="py-3 px-3 text-center">
        {isGraduate ? (
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            GRADUATE
          </span>
        ) : isPending ? (
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-amber-700" />
            PENDING
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-100 text-red-900 border border-red-300 flex items-center justify-center gap-1">
            <XCircle className="w-3 h-3 text-red-700" />
            NOT YET
          </span>
        )}
      </td>

      {/* Honour Class */}
      <td className="py-3 px-3 text-center">
        {row.honourClass && isGraduate ? (
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${honourBadge.badgeBg} ${honourBadge.badgeText} ${honourBadge.badgeBorder}`}
          >
            {row.honourClass}
          </span>
        ) : (
          <span className="text-ink-400 text-[11px]">-</span>
        )}
      </td>

      {/* Certificate Action */}
      <td className="py-3 px-3 text-center">
        {hasCert ? (
          <button
            type="button"
            onClick={() =>
              onViewCertificate({
                id: row.certificateId!,
                certificateNo: row.certificateNo!,
                studentId: row.studentId,
                studentName: row.fullName,
                matricNo: row.matricNo,
                passportUrl: row.passportUrl,
                cohortName: semesterName,
                cohortType: row.cohortType,
                cumulativeTotal: row.cumulativeTotal ?? 0,
                honourClass: row.honourClass ?? 'Pass',
                issuedAt: row.certificateIssuedAt ?? '',
                formattedIssuedDate: new Date().toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }),
              })
            }
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-solar-100 text-solar-900 hover:bg-solar-200 border border-solar-300 transition-colors flex items-center justify-center gap-1 mx-auto"
          >
            <Award className="w-3 h-3 text-solar-700" />
            <span>{row.certificateNo}</span>
          </button>
        ) : isGraduate ? (
          <button
            type="button"
            onClick={() => onIssueCertificate(row.studentId)}
            disabled={issuingStudentId === row.studentId}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-ink-950 text-white hover:bg-ink-800 transition-colors flex items-center justify-center gap-1 mx-auto disabled:opacity-50"
          >
            <Award className="w-3 h-3 text-solar-400" />
            <span>{issuingStudentId === row.studentId ? 'Issuing...' : 'Issue Cert'}</span>
          </button>
        ) : (
          <span className="text-ink-400 text-[11px] italic">Not Cleared</span>
        )}
      </td>
    </tr>
  );
}
