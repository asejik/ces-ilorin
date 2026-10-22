import type { FormEvent } from 'react';
import { Edit3, Save, X, AlertCircle } from 'lucide-react';
import type { OverrideTarget } from './types';

export function OverrideModal({
  target,
  scoreInput,
  onScoreChange,
  reasonInput,
  onReasonChange,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  target: OverrideTarget;
  scoreInput: string;
  onScoreChange: (value: string) => void;
  reasonInput: string;
  onReasonChange: (value: string) => void;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl border border-ink-200 shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-ink-100 mb-4">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-solar-600" />
            <h3 className="font-heading font-bold text-sm text-ink-950">Manual Score Override</h3>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="bg-canvas p-3 rounded-xl border border-ink-200 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-ink-500">Student:</span>
              <strong className="text-ink-950">{target.studentName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Matric:</span>
              <span className="font-mono font-bold text-ink-950">{target.matricNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Course Assessment:</span>
              <strong className="text-ink-950">{target.courseTitle}</strong>
            </div>
            <div className="flex justify-between border-t border-ink-200 pt-1">
              <span className="text-ink-500">Max Marks Allowed:</span>
              <strong className="text-solar-700">{target.maxScore} Marks</strong>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-status-notyet-bg text-status-notyet-text text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-ink-700 mb-1">
              New Score (/ {target.maxScore})
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max={target.maxScore}
              value={scoreInput}
              onChange={(e) => onScoreChange(e.target.value)}
              placeholder={`e.g. ${target.maxScore}`}
              className="w-full h-10 px-3 rounded-xl border border-ink-200 font-mono font-bold text-sm text-ink-950 focus:ring-2 focus:ring-solar-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-700 mb-1 flex items-center justify-between">
              <span>Mandatory Override Reason</span>
              <span className="text-[10px] text-ink-400 font-normal">Audit required</span>
            </label>
            <textarea
              rows={2}
              value={reasonInput}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="e.g. Make-up test taken on paper in church office due to technical error..."
              className="w-full p-2.5 rounded-xl border border-ink-200 text-xs text-ink-950 focus:ring-2 focus:ring-solar-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-ink-300 text-xs font-bold text-ink-700 hover:bg-canvas transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-10 rounded-xl bg-ink-950 text-white text-xs font-bold hover:bg-ink-900 transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {saving ? (
                <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-solar-400" />
                  <span>Save Score Override</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
