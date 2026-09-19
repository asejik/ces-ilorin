'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  KeyRound,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wifi,
  WifiOff,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Home,
  RotateCcw,
} from 'lucide-react';
import {
  verifyAssessmentAccessAction,
  submitAssessmentAction,
  getAvailableQuizzesAction,
  type SanitizedQuestion,
} from '@/actions/assessment';

type AssessmentStep = 'access' | 'confirm' | 'taking' | 'result';

interface AvailableQuiz {
  id: string;
  course_code: string;
  title: string;
  assessment_type: 'quiz' | 'final_exam';
  max_score: number;
  is_open: boolean;
}

interface CandidateInfo {
  id: string;
  matricNo: string;
  fullName: string;
  cohortType: string;
}

interface QuizInfo {
  id: string;
  courseCode: string;
  title: string;
  assessmentType: 'quiz' | 'final_exam';
  maxScore: number;
  questionCount: number;
}

export default function AssessmentPortalPage() {
  const [step, setStep] = useState<AssessmentStep>('access');
  const [availableQuizzes, setAvailableQuizzes] = useState<AvailableQuiz[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<'Regular' | 'Sunday Cohort'>('Regular');
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Form input states
  const [matricNo, setMatricNo] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [sessionPin, setSessionPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active quiz state
  const [candidate, setCandidate] = useState<CandidateInfo | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<QuizInfo | null>(null);
  const [questions, setQuestions] = useState<SanitizedQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Result state
  const [resultScore, setResultScore] = useState<number | null>(null);
  const [resultMaxScore, setResultMaxScore] = useState<number | null>(null);
  const [resultPercentage, setResultPercentage] = useState<number | null>(null);

  // Monitor online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch quizzes on cohort change
  useEffect(() => {
    async function loadQuizzes() {
      const res = await getAvailableQuizzesAction(selectedCohort);
      if (res.success && res.quizzes) {
        setAvailableQuizzes(res.quizzes);
        if (res.quizzes.length > 0 && !selectedCourse) {
          const firstOpen = res.quizzes.find((q) => q.is_open) || res.quizzes[0];
          setSelectedCourse(firstOpen.course_code);
        }
      }
    }
    loadQuizzes();
  }, [selectedCohort, selectedCourse]);

  // Restore cached draft answers if refreshing during quiz
  useEffect(() => {
    if (activeQuiz && candidate) {
      const draftKey = `ces_quiz_draft_${candidate.matricNo}_${activeQuiz.id}`;
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            setAnswers(parsed);
          }
        } catch {
          // ignore corrupted localstorage
        }
      }
    }
  }, [activeQuiz, candidate]);

  // Save answer to state & localStorage
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    const updated = { ...answers, [questionId]: optionIndex };
    setAnswers(updated);
    if (activeQuiz && candidate) {
      const draftKey = `ces_quiz_draft_${candidate.matricNo}_${activeQuiz.id}`;
      localStorage.setItem(draftKey, JSON.stringify(updated));
    }
  };

  // Step 1: Verify Access Gate
  const handleVerifyAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!matricNo.trim()) {
      setErrorMsg('Please enter your Official Matriculation Number');
      return;
    }
    if (!selectedCourse) {
      setErrorMsg('Please select a course assessment to take');
      return;
    }
    if (!sessionPin.trim()) {
      setErrorMsg('Please enter the active Session PIN provided by your instructor');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyAssessmentAccessAction({
        matricNo,
        courseCode: selectedCourse,
        sessionPin,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Access denied. Please check your credentials.');
        setLoading(false);
        return;
      }

      if (res.student && res.quiz && res.questions) {
        setCandidate(res.student);
        setActiveQuiz(res.quiz);
        setQuestions(res.questions);
        setCurrentQIndex(0);
        setStep('confirm');
      }
    } catch {
      setErrorMsg('An unexpected network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> Step 3: Start Taking Quiz
  const handleStartQuiz = () => {
    setStep('taking');
  };

  // Step 3 -> Step 4: Submit Assessment
  const handleSubmitAssessment = async () => {
    if (!candidate || !activeQuiz) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await submitAssessmentAction({
        matricNo: candidate.matricNo,
        quizId: activeQuiz.id,
        answers,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Submission failed. Please contact your instructor.');
        setShowConfirmSubmit(false);
        setLoading(false);
        return;
      }

      // Clear cached draft upon successful submission
      const draftKey = `ces_quiz_draft_${candidate.matricNo}_${activeQuiz.id}`;
      localStorage.removeItem(draftKey);

      setResultScore(res.score ?? 0);
      setResultMaxScore(res.maxScore ?? activeQuiz.maxScore);
      setResultPercentage(res.percentage ?? 0);
      setShowConfirmSubmit(false);
      setStep('result');
    } catch {
      setErrorMsg('Network error while recording submission. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset to take another quiz
  const handleTakeAnother = () => {
    setStep('access');
    setAnswers({});
    setCurrentQIndex(0);
    setErrorMsg(null);
    setSessionPin('');
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQIndex];

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <header className="border-b border-ink-200 bg-surface/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ink-950 flex items-center justify-center text-solar-400 shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-sm sm:text-base text-ink-950 block leading-tight">
              CES Assessment Room
            </span>
            <span className="text-[11px] text-ink-500 font-medium">
              Citizens Elementary School · Discipleship Training
            </span>
          </div>
        </div>

        {/* Connectivity Status & Return Home */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isOnline
                ? 'bg-status-graduate-bg text-status-graduate-text'
                : 'bg-solar-100 text-solar-700'
            }`}
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline (Saved)'}</span>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-ink-600 hover:text-ink-950 flex items-center gap-1 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </div>
      </header>

      {/* Main Assessment Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {/* =================================================================== */}
        {/* STEP 1: ACCESS GATE                                                 */}
        {/* =================================================================== */}
        {step === 'access' && (
          <div className="bg-surface rounded-2xl border border-ink-200 shadow-md p-6 sm:p-10 relative overflow-hidden">
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

            <form onSubmit={handleVerifyAccess} className="space-y-5 max-w-md mx-auto">
              {/* Cohort Selector Tabs */}
              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
                  Select Cohort
                </label>
                <div className="grid grid-cols-2 gap-2 bg-canvas p-1 rounded-xl border border-ink-200">
                  <button
                    type="button"
                    onClick={() => setSelectedCohort('Regular')}
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
                    onClick={() => setSelectedCohort('Sunday Cohort')}
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
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-ink-200 bg-surface text-ink-950 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-transparent transition-all appearance-none cursor-pointer"
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
                  onChange={(e) => setMatricNo(e.target.value.toUpperCase())}
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
                  placeholder="e.g. SALV26"
                  value={sessionPin}
                  onChange={(e) => setSessionPin(e.target.value.toUpperCase())}
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
        )}

        {/* =================================================================== */}
        {/* STEP 2: CANDIDATE CONFIRMATION                                      */}
        {/* =================================================================== */}
        {step === 'confirm' && candidate && activeQuiz && (
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
                <strong className="text-ink-950 font-bold">{activeQuiz.title}</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-500 font-medium">Total Questions</span>
                <strong className="text-ink-950">{activeQuiz.questionCount} Questions</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-500 font-medium">Maximum Marks</span>
                <strong className="text-solar-700 font-extrabold">{activeQuiz.maxScore} Marks</strong>
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
                onClick={() => setStep('access')}
                className="h-11 px-4 rounded-xl border border-ink-300 text-xs font-bold text-ink-700 hover:bg-canvas transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartQuiz}
                className="flex-1 h-11 rounded-xl bg-ink-950 text-white text-xs font-bold hover:bg-ink-900 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Start Assessment Now</span>
                <ChevronRight className="w-4 h-4 text-solar-400" />
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 3: INTERACTIVE QUIZ TAKER                                      */}
        {/* =================================================================== */}
        {step === 'taking' && candidate && activeQuiz && currentQuestion && (
          <div className="space-y-4">
            {/* Header / Progress Bar */}
            <div className="bg-surface rounded-2xl border border-ink-200 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-extrabold text-ink-950 text-sm">
                    {activeQuiz.title}
                  </span>
                  <span className="text-ink-400">·</span>
                  <span className="font-mono text-ink-600">{candidate.matricNo}</span>
                </div>
                <div className="font-bold text-ink-700">
                  Question {currentQIndex + 1} of {totalQuestions}
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
                      onClick={() => setCurrentQIndex(idx)}
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
                  const optionLetters = ['A', 'B', 'C', 'D'];
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-solar-500 bg-solar-50/70 shadow-xs'
                          : 'border-ink-200 bg-surface hover:border-ink-300 hover:bg-canvas'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 transition-colors ${
                          isSelected
                            ? 'bg-solar-500 text-white'
                            : 'bg-ink-100 text-ink-700'
                        }`}
                      >
                        {optionLetters[optIdx]}
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
                  onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                  className="h-10 px-3.5 rounded-xl border border-ink-200 text-xs font-bold text-ink-700 hover:bg-canvas disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {currentQIndex < totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                    className="h-10 px-5 rounded-xl bg-ink-950 text-white text-xs font-bold hover:bg-ink-900 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-4 h-4 text-solar-400" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmSubmit(true)}
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
                  onClick={() => setShowConfirmSubmit(true)}
                  className="text-xs font-bold text-solar-700 hover:text-solar-800 underline"
                >
                  Review and Submit
                </button>
              </div>
            )}
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {showConfirmSubmit && (
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
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 h-10 rounded-xl border border-ink-300 text-xs font-bold text-ink-700 hover:bg-canvas transition-colors"
                >
                  Return to Questions
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmitAssessment}
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
        )}

        {/* =================================================================== */}
        {/* STEP 4: INSTANT RESULT CARD                                         */}
        {/* =================================================================== */}
        {step === 'result' && candidate && activeQuiz && (
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
                {resultScore?.toFixed(2)}
                <span className="text-xl sm:text-2xl text-ink-400 font-normal"> / {resultMaxScore?.toFixed(2)}</span>
              </div>
              <div className="mt-2 text-sm font-extrabold text-solar-800">
                {resultPercentage}% Score
              </div>

              {/* Status Badge */}
              <div className="mt-3 inline-block">
                {(resultPercentage ?? 0) >= 85 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-status-graduate-bg text-status-graduate-text border border-status-graduate-dot/30">
                    🏆 Distinction Standing
                  </span>
                ) : (resultPercentage ?? 0) >= 50 ? (
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
                <strong className="text-ink-950">{activeQuiz.title}</strong>
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
                onClick={handleTakeAnother}
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
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-ink-200 bg-surface/50 py-4 px-4 text-center text-xs text-ink-500">
        Citizens Elementary School · Official Discipleship Training Platform · Citizens of Light Church, Ilorin
      </footer>
    </div>
  );
}
