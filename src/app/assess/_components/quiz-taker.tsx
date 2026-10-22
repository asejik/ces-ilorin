import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SanitizedQuestion } from '@/actions/assessment';
import type { CandidateInfo, QuizInfo } from './types';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export function QuizTaker({
  candidate,
  quiz,
  questions,
  currentQuestion,
  currentQIndex,
  onSelectIndex,
  answers,
  answeredCount,
  totalQuestions,
  onSelectOption,
  onAbandon,
  onReviewSubmit,
}: {
  candidate: CandidateInfo;
  quiz: QuizInfo;
  questions: SanitizedQuestion[];
  currentQuestion: SanitizedQuestion;
  currentQIndex: number;
  onSelectIndex: (updater: number | ((prev: number) => number)) => void;
  answers: Record<string, number>;
  answeredCount: number;
  totalQuestions: number;
  onSelectOption: (questionId: string, optionIndex: number) => void;
  onAbandon: () => void;
  onReviewSubmit: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Header / Progress Bar */}
      <div className="bg-surface rounded-2xl border border-ink-200 p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-2">
            <span className="font-heading font-extrabold text-ink-950 text-sm">{quiz.title}</span>
            <span className="text-ink-400">·</span>
            <span className="font-mono text-ink-600">{candidate.matricNo}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="font-bold text-ink-700">
              Question {currentQIndex + 1} of {totalQuestions}
            </div>
            <button
              type="button"
              onClick={onAbandon}
              className="text-[11px] font-medium text-ink-400 hover:text-red-600 underline transition-colors"
            >
              Exit Test
            </button>
          </div>
        </div>

        {/* Progress Bar Line */}
        <div className="w-full bg-ink-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-solar-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${((currentQIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Question Navigation Palette */}
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-ink-100">
          {questions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = idx === currentQIndex;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onSelectIndex(idx)}
                className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                  isCurrent
                    ? 'bg-ink-950 text-white shadow-xs'
                    : isAnswered
                    ? 'bg-status-graduate-bg text-status-graduate-text border border-status-graduate-dot/30'
                    : 'bg-canvas text-ink-600 hover:bg-ink-100 border border-ink-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Question Card */}
      <div className="bg-surface rounded-2xl border border-ink-200 shadow-md p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-solar-700 bg-solar-50 px-2.5 py-1 rounded-full border border-solar-200">
            Question {currentQIndex + 1} ({currentQuestion.marks} Mark)
          </span>
          <span className="text-xs text-ink-500 font-medium">
            {answers[currentQuestion.id] !== undefined ? 'Answered' : 'Not yet answered'}
          </span>
        </div>

        <h3 className="font-heading font-bold text-base sm:text-lg text-ink-950 leading-snug mb-6">
          {currentQuestion.questionText}
        </h3>

        {/* 4 Options (A, B, C, D) */}
        <div className="space-y-3">
          {currentQuestion.options.map((optionText, optIdx) => {
            const isSelected = answers[currentQuestion.id] === optIdx;
            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => onSelectOption(currentQuestion.id, optIdx)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3.5 ${
                  isSelected
                    ? 'border-solar-500 bg-solar-50/70 shadow-xs'
                    : 'border-ink-200 bg-surface hover:border-ink-300 hover:bg-canvas'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 transition-colors ${
                    isSelected ? 'bg-solar-500 text-white' : 'bg-ink-100 text-ink-700'
                  }`}
                >
                  {OPTION_LETTERS[optIdx]}
                </span>
                <span
                  className={`text-xs sm:text-sm leading-relaxed ${
                    isSelected ? 'text-ink-950 font-bold' : 'text-ink-700 font-normal'
                  }`}
                >
                  {optionText}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Card Controls */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-ink-100">
          <button
            type="button"
            disabled={currentQIndex === 0}
            onClick={() => onSelectIndex((prev) => Math.max(0, prev - 1))}
            className="h-10 px-3.5 rounded-xl border border-ink-200 text-xs font-bold text-ink-700 hover:bg-canvas disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {currentQIndex < totalQuestions - 1 ? (
            <button
              type="button"
              onClick={() => onSelectIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
              className="h-10 px-5 rounded-xl bg-ink-950 text-white text-xs font-bold hover:bg-ink-900 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Next Question</span>
              <ChevronRight className="w-4 h-4 text-solar-400" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onReviewSubmit}
              className="h-10 px-6 rounded-xl bg-solar-600 text-white text-xs font-bold hover:bg-solar-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <span>Finish & Submit</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Submit Banner if on last questions */}
      {currentQIndex === totalQuestions - 1 && (
        <div className="bg-canvas rounded-xl p-4 border border-ink-200 flex items-center justify-between text-xs">
          <span className="text-ink-600">
            Answered: <strong>{answeredCount}</strong> of <strong>{totalQuestions}</strong> questions
          </span>
          <button
            type="button"
            onClick={onReviewSubmit}
            className="text-xs font-bold text-solar-700 hover:text-solar-800 underline"
          >
            Review and Submit
          </button>
        </div>
      )}
    </div>
  );
}
