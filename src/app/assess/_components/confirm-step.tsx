import { ChevronRight, Clock, UserCheck } from 'lucide-react';
import type { CandidateInfo, QuizInfo } from './types';

export function ConfirmStep({
  candidate,
  quiz,
  onCancel,
  onStart,
}: {
  candidate: CandidateInfo;
  quiz: QuizInfo;
  onCancel: () => void;
  onStart: () => void;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-ink-200 shadow-md p-6 sm:p-10 text-center relative overflow-hidden max-w-lg mx-auto w-full">
      <div className="absolute top-0 inset-x-0 h-2 bg-solar-500" />

      <div className="w-14 h-14 rounded-full bg-status-graduate-bg border-2 border-status-graduate-dot/20 flex items-center justify-center text-status-graduate-dot mx-auto mb-4 shadow-xs">
        <UserCheck className="w-7 h-7" />
      </div>

      <h2 className="font-heading font-bold text-xl sm:text-2xl text-ink-950 tracking-tight">
        Candidate Confirmed
      </h2>
      <p className="text-xs sm:text-sm text-ink-600 mt-1 mb-6">
        Please review your details before commencing the assessment.
      </p>

      <div className="bg-canvas rounded-xl p-5 border border-ink-200/80 text-left space-y-3 mb-6">
        <div className="flex justify-between items-center text-xs">
          <span className="text-ink-500 font-medium">Student Name</span>
          <strong className="text-ink-950 font-bold">{candidate.fullName}</strong>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-ink-500 font-medium">Matriculation Number</span>
          <span className="font-mono font-bold text-ink-950 bg-ink-100 px-2 py-0.5 rounded">
            {candidate.matricNo}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-ink-500 font-medium">Cohort</span>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              candidate.cohortType === 'Sunday Cohort'
                ? 'bg-sunday-100 text-sunday-700'
                : 'bg-ink-950 text-white'
            }`}
          >
            {candidate.cohortType}
          </span>
        </div>
        <div className="border-t border-ink-200 pt-3 flex justify-between items-center text-xs">
          <span className="text-ink-500 font-medium">Course Title</span>
          <strong className="text-ink-950 font-bold">{quiz.title}</strong>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-ink-500 font-medium">Total Questions</span>
          <strong className="text-ink-950">{quiz.questionCount} Questions</strong>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-ink-500 font-medium">Maximum Marks</span>
          <strong className="text-solar-700 font-extrabold">{quiz.maxScore} Marks</strong>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-solar-50 border border-solar-200 text-solar-800 text-xs text-left mb-6 flex items-start gap-2.5">
        <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-solar-600" />
        <span>
          <strong>Honor Code:</strong> Once submitted, your score will be permanently recorded to your student profile.
          Duplicate attempts are blocked by institutional policy.
        </span>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 px-4 rounded-xl border border-ink-300 text-xs font-bold text-ink-700 hover:bg-canvas transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onStart}
          className="flex-1 h-11 rounded-xl bg-ink-950 text-white text-xs font-bold hover:bg-ink-900 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <span>Start Assessment Now</span>
          <ChevronRight className="w-4 h-4 text-solar-400" />
        </button>
      </div>
    </div>
  );
}
