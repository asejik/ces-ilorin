import Link from 'next/link';
import { ArrowLeft, Award, FileSpreadsheet, RefreshCw } from 'lucide-react';

export function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-ink-950 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in border border-ink-800">
      <Award className="w-4 h-4 text-solar-400 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function BroadsheetHeader({
  loading,
  batchIssuing,
  onRefresh,
  onExport,
  onBatchIssue,
}: {
  loading: boolean;
  batchIssuing: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onBatchIssue: () => void;
}) {
  return (
    <header className="border-b border-ink-200 bg-surface px-4 sm:px-8 py-4 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-9 h-9 rounded-xl border border-ink-200 flex items-center justify-center text-ink-600 hover:text-ink-950 hover:bg-canvas transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-base sm:text-lg text-ink-950">
                Master Graduation Broadsheet
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-solar-100 text-solar-800">
                Board Review
              </span>
            </div>
            <p className="text-xs text-ink-500">
              Official composite results, continuous assessments, clearance standing, and certificate issuance.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="h-9 px-3 rounded-lg border border-ink-200 text-xs font-semibold text-ink-700 hover:bg-canvas transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={onExport}
            className="h-9 px-3.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={onBatchIssue}
            disabled={batchIssuing}
            className="h-9 px-3.5 rounded-lg bg-solar-600 text-white text-xs font-bold hover:bg-solar-700 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Award className={`w-4 h-4 ${batchIssuing ? 'animate-bounce' : ''}`} />
            <span>{batchIssuing ? 'Issuing...' : 'Batch Issue All'}</span>
          </button>

          <Link
            href="/admin/semesters"
            className="h-9 px-3 rounded-lg bg-surface border border-ink-300 text-ink-800 text-xs font-semibold hover:bg-surface-subtle transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Semesters</span>
          </Link>

          <Link
            href="/admin/gradebook"
            className="h-9 px-3 rounded-lg bg-surface border border-ink-300 text-ink-800 text-xs font-semibold hover:bg-surface-subtle transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Teacher Gradebook →</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
