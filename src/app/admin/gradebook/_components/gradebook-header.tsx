import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';

export function GradebookHeader({
  loading,
  onRefresh,
}: {
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <header className="border-b border-ink-200 bg-surface px-4 sm:px-8 py-4 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
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
                Teacher Gradebook & Override Roster
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-solar-100 text-solar-800">
                Academic Gradebook
              </span>
            </div>
            <p className="text-xs text-ink-500">
              Continuous assessment scores, manual score overrides with audit logging, and attendance clearance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="h-9 px-3 rounded-lg border border-ink-200 text-xs font-semibold text-ink-700 hover:bg-canvas transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Roster</span>
          </button>
          <Link
            href="/admin/broadsheet"
            className="h-9 px-3 rounded-lg bg-solar-50 border border-solar-300 text-solar-900 text-xs font-bold hover:bg-solar-100 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Master Broadsheet →</span>
          </Link>
          <Link
            href="/admin/attendance"
            className="h-9 px-3 rounded-lg bg-surface border border-ink-300 text-ink-800 text-xs font-semibold hover:bg-surface-subtle transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Feedback Analytics →</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
