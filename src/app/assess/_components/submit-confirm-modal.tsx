import { CheckCircle2, Sparkles } from 'lucide-react';

export function SubmitConfirmModal({
  answeredCount,
  totalQuestions,
  errorMsg,
  loading,
  onReturn,
  onConfirm,
}: {
  answeredCount: number;
  totalQuestions: number;
  errorMsg: string | null;
  loading: boolean;
  onReturn: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl border border-ink-200 shadow-xl max-w-md w-full p-6 text-center animate-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-full bg-solar-50 border border-solar-200 flex items-center justify-center text-solar-600 mx-auto mb-3 shadow-xs">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="font-heading font-bold text-lg text-ink-950">
          Ready to submit your assessment?
        </h3>
        <p className="text-xs text-ink-600 mt-1 mb-5">
          You have answered <strong>{answeredCount}</strong> out of <strong>{totalQuestions}</strong> questions.
          {answeredCount < totalQuestions && (
            <span className="text-status-notyet-dot block mt-1 font-semibold">
              Warning: You have {totalQuestions - answeredCount} unanswered question(s).
            </span>
          )}
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-status-notyet-bg text-status-notyet-text text-xs text-left">
            {errorMsg}
          </div>
        )}

        <div className="flex gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onReturn}
            className="flex-1 h-10 rounded-xl border border-ink-300 text-xs font-bold text-ink-700 hover:bg-canvas transition-colors"
          >
            Return to Questions
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex-1 h-10 rounded-xl bg-ink-950 text-white text-xs font-bold hover:bg-ink-900 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>Confirm & Record</span>
                <CheckCircle2 className="w-4 h-4 text-status-graduate-dot" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
