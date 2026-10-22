import Link from 'next/link';
import { ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react';
import type { CandidateInfo, QuizInfo } from './types';

export function ResultCard({
  candidate,
  quiz,
  score,
  maxScore,
  percentage,
  onTakeAnother,
}: {
  candidate: CandidateInfo;
  quiz: QuizInfo;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  onTakeAnother: () => void;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-ink-200 shadow-md p-6 sm:p-10 text-center relative overflow-hidden max-w-lg mx-auto w-full">
      <div className="absolute top-0 inset-x-0 h-2 bg-solar-500" />

      <div className="w-16 h-16 rounded-full bg-status-graduate-bg border-2 border-status-graduate-dot/20 flex items-center justify-center text-status-graduate-dot mx-auto mb-4 shadow-xs">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <h2 className="font-heading font-bold text-2xl sm:text-3xl text-ink-950 tracking-tight">
        Assessment Recorded!
      </h2>
      <p className="text-xs sm:text-sm text-ink-600 mt-1 mb-6">
        Well done, <strong>{candidate.fullName}</strong>. Your performance has been logged.
      </p>

      {/* Score Display Box */}
      <div className="p-6 rounded-2xl border-2 border-solar-400 bg-solar-50/70 shadow-xs mb-6 text-center">
        <span className="text-[11px] font-bold uppercase tracking-widest text-solar-700 block mb-1">
          Score Earned
        </span>
        <div className="font-mono font-extrabold text-4xl sm:text-5xl text-ink-950 tabular-nums">
          {score?.toFixed(2)}
          <span className="text-xl sm:text-2xl text-ink-400 font-normal"> / {maxScore?.toFixed(2)}</span>
        </div>
        <div className="mt-2 text-sm font-extrabold text-solar-800">{percentage}% Score</div>

        {/* Status Badge */}
        <div className="mt-3 inline-block">
          {(percentage ?? 0) >= 85 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-status-graduate-bg text-status-graduate-text border border-status-graduate-dot/30">
              🏆 Distinction Standing
            </span>
          ) : (percentage ?? 0) >= 50 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-status-graduate-bg text-status-graduate-text border border-status-graduate-dot/30">
              ✅ Pass Mark Achieved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-status-notyet-bg text-status-notyet-text border border-status-notyet-dot/30">
              ⚠️ Below Pass Mark (50%)
            </span>
          )}
        </div>
      </div>

      {/* Metadata Summary */}
      <div className="bg-canvas rounded-xl p-4 border border-ink-200 text-left space-y-2 text-xs mb-6">
        <div className="flex justify-between">
          <span className="text-ink-500">Course:</span>
          <strong className="text-ink-950">{quiz.title}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-500">Matriculation Number:</span>
          <span className="font-mono font-bold text-ink-950">{candidate.matricNo}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-500">Recorded At:</span>
          <span className="text-ink-700">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onTakeAnother}
          className="flex-1 h-11 rounded-xl bg-ink-950 text-white text-xs font-bold hover:bg-ink-900 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <RotateCcw className="w-4 h-4 text-solar-400" />
          <span>Take Another Assessment</span>
        </button>
        <Link
          href="/"
          className="h-11 px-5 rounded-xl border border-ink-300 text-xs font-bold text-ink-700 hover:bg-canvas transition-colors flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Portal Home</span>
        </Link>
      </div>
    </div>
  );
}
