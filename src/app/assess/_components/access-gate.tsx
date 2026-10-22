import type { FormEvent } from 'react';
import { AlertCircle, BookOpen, ChevronRight, GraduationCap, KeyRound } from 'lucide-react';
import type { AvailableQuiz, CohortFilter } from './types';

export function AccessGate({
  selectedCohort,
  onCohortChange,
  availableQuizzes,
  selectedCourse,
  onCourseChange,
  matricNo,
  onMatricChange,
  sessionPin,
  onPinChange,
  errorMsg,
  loading,
  onSubmit,
}: {
  selectedCohort: CohortFilter;
  onCohortChange: (cohort: CohortFilter) => void;
  availableQuizzes: AvailableQuiz[];
  selectedCourse: string;
  onCourseChange: (code: string) => void;
  matricNo: string;
  onMatricChange: (value: string) => void;
  sessionPin: string;
  onPinChange: (value: string) => void;
  errorMsg: string | null;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <>
      {/* Quiz Restoration Skeleton - displayed immediately by CSS if ces-restoring-quiz class is present */}
      <div
        data-quiz-skeleton
        className="hidden min-h-[380px] flex-col items-center justify-center p-8 bg-surface rounded-2xl border border-ink-200 shadow-md max-w-xl mx-auto w-full text-center animate-pulse"
      >
        <div className="w-14 h-14 rounded-2xl bg-solar-50 border border-solar-200 flex items-center justify-center text-solar-600 mb-4 shadow-xs mx-auto">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h2 className="font-heading font-bold text-lg text-ink-950 mb-1">
          Resuming Assessment Session...
        </h2>
        <p className="text-xs text-ink-500 max-w-xs mx-auto">
          Restoring your question answers and session progress.
        </p>
      </div>

      <div data-gate-container className="bg-surface rounded-2xl border border-ink-200 shadow-md p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-2 bg-solar-500" />

        <div className="text-center max-w-md mx-auto mb-8">
          <div className="w-12 h-12 rounded-2xl bg-solar-50 border border-solar-200 flex items-center justify-center text-solar-600 mx-auto mb-3 shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink-950 tracking-tight">
            Enter Assessment Room
          </h1>
          <p className="text-xs sm:text-sm text-ink-600 mt-1.5">
            Provide your matriculation number and the session PIN announced by your instructor.
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-status-notyet-bg border border-status-notyet-dot/30 text-status-notyet-text text-xs flex items-start gap-3 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-status-notyet-dot" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5 max-w-md mx-auto">
          {/* Cohort Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
              Select Cohort
            </label>
            <div className="grid grid-cols-2 gap-2 bg-canvas p-1 rounded-xl border border-ink-200">
              <button
                type="button"
                onClick={() => onCohortChange('Regular')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  selectedCohort === 'Regular'
                    ? 'bg-surface text-ink-950 shadow-xs border border-ink-200'
                    : 'text-ink-600 hover:text-ink-950'
                }`}
              >
                Regular Cohort
              </button>
              <button
                type="button"
                onClick={() => onCohortChange('Sunday Cohort')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  selectedCohort === 'Sunday Cohort'
                    ? 'bg-sunday-500 text-white shadow-xs'
                    : 'text-ink-600 hover:text-sunday-600'
                }`}
              >
                Sunday Cohort
              </button>
            </div>
          </div>

          {/* Course Selector */}
          <div>
            <label htmlFor="courseSelect" className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
              Course Assessment
            </label>
            <div className="relative">
              <select
                id="courseSelect"
                value={selectedCourse}
                onChange={(e) => onCourseChange(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-ink-200 bg-surface text-ink-950 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-transparent transition-colors appearance-none cursor-pointer"
              >
                {availableQuizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.course_code}>
                    {quiz.title} ({quiz.max_score} marks) {quiz.is_open ? '— [OPEN]' : '— [CLOSED]'}
                  </option>
                ))}
              </select>
              <BookOpen className="w-4 h-4 text-ink-400 absolute right-4 top-4 pointer-events-none" />
            </div>
          </div>

          {/* Matriculation Number Input */}
          <div>
            <label htmlFor="matricInput" className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
              Official Matriculation Number
            </label>
            <input
              id="matricInput"
              type="text"
              placeholder="e.g. CES/ILR/26I901"
              value={matricNo}
              onChange={(e) => onMatricChange(e.target.value.toUpperCase())}
              className="w-full h-12 px-4 rounded-xl border border-ink-200 bg-surface text-ink-950 font-mono font-semibold text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-transparent transition-all uppercase placeholder:normal-case placeholder:font-sans placeholder:text-ink-400"
            />
          </div>

          {/* Session PIN Input */}
          <div>
            <label htmlFor="pinInput" className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
              Teacher Session PIN
            </label>
            <input
              id="pinInput"
              type="text"
              placeholder="e.g. AB12CD"
              value={sessionPin}
              onChange={(e) => onPinChange(e.target.value.toUpperCase())}
              className="w-full h-12 px-4 rounded-xl border border-ink-200 bg-surface text-ink-950 font-mono font-bold text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-transparent transition-all uppercase placeholder:normal-case placeholder:font-sans placeholder:text-ink-400"
            />
          </div>

          {/* Submit Access Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-ink-950 text-white text-sm font-bold hover:bg-ink-900 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>Verify & Enter Room</span>
                <ChevronRight className="w-4 h-4 text-solar-400" />
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
}
