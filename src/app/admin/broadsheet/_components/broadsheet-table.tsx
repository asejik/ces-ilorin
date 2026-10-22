import { RefreshCw } from 'lucide-react';
import { QUIZ_COLUMNS } from '@/lib/quiz-columns';
import type { CertificateDetails, StudentBroadsheetRow } from '@/types/broadsheet';
import { BroadsheetRow } from './broadsheet-row';

export function BroadsheetTable({
  loading,
  rows,
  semesterName,
  issuingStudentId,
  onViewCertificate,
  onIssueCertificate,
}: {
  loading: boolean;
  rows: StudentBroadsheetRow[];
  semesterName: string;
  issuingStudentId: string | null;
  onViewCertificate: (cert: CertificateDetails) => void;
  onIssueCertificate: (studentId: string) => void;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-ink-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-surface-subtle border-b border-ink-200 text-[11px] font-bold text-ink-600 uppercase tracking-wider">
              <th className="py-3 px-3 w-10 text-center">#</th>
              <th className="py-3 px-3 min-w-[180px]">Candidate Details</th>
              {QUIZ_COLUMNS.map((col) => (
                <th key={col.code} className="py-3 px-2 text-center w-12" title={col.name}>
                  {col.short}
                </th>
              ))}
              <th className="py-3 px-2 text-center w-14 bg-solar-50/50 font-extrabold text-ink-900">
                Quiz /40
              </th>
              <th className="py-3 px-2 text-center w-14 bg-solar-50/50 font-extrabold text-ink-900">
                Exam /60
              </th>
              <th className="py-3 px-2 text-center w-16 bg-solar-100/50 font-black text-ink-950">
                Total /100
              </th>
              <th className="py-3 px-2 text-center min-w-[110px]">Elem. Princ.</th>
              <th className="py-3 px-2 text-center min-w-[110px]">Mem. & Vision</th>
              <th className="py-3 px-3 text-center min-w-[120px]">Clearance</th>
              <th className="py-3 px-3 text-center min-w-[100px]">Honours</th>
              <th className="py-3 px-3 text-center min-w-[140px]">Certificate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {loading ? (
              <tr>
                <td colSpan={19} className="py-12 text-center text-ink-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-solar-500" />
                  Loading master academic broadsheet...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={19} className="py-12 text-center text-ink-500">
                  No candidate records found matching your filters.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <BroadsheetRow
                  key={row.studentId}
                  row={row}
                  index={idx}
                  semesterName={semesterName}
                  issuingStudentId={issuingStudentId}
                  onViewCertificate={onViewCertificate}
                  onIssueCertificate={onIssueCertificate}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
