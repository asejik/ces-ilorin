'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  verifyAssessmentAccessAction,
  submitAssessmentAction,
  getAvailableQuizzesAction,
  type SanitizedQuestion,
} from '@/actions/assessment';
import { ACTIVE_ASSESSMENT_SESSION_KEY, clearActiveAssessmentSession } from './session-storage';
import {
  DEFAULT_AVAILABLE_QUIZZES,
  type AssessmentStep,
  type AvailableQuiz,
  type CandidateInfo,
  type CohortFilter,
  type QuizInfo,
} from './types';

/** All state, persistence and server calls for the student assessment room. */
export function useAssessment() {
  const [step, setStep] = useState<AssessmentStep>('access');
  const [availableQuizzes, setAvailableQuizzes] = useState<AvailableQuiz[]>(DEFAULT_AVAILABLE_QUIZZES);
  const [selectedCohort, setSelectedCohort] = useState<CohortFilter>('Regular');
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Form input states
  const [matricNo, setMatricNo] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('salvation');
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

  // Restore active assessment session if page was refreshed mid-quiz
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ACTIVE_ASSESSMENT_SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        const maxAgeMs = 4 * 60 * 60 * 1000; // 4 hours validity
        if (
          session &&
          typeof session === 'object' &&
          Date.now() - (session.savedAt || 0) < maxAgeMs
        ) {
          if (
            (session.step === 'taking' || session.step === 'confirm') &&
            session.candidate &&
            session.activeQuiz &&
            Array.isArray(session.questions) &&
            session.questions.length > 0
          ) {
            setCandidate(session.candidate);
            setActiveQuiz(session.activeQuiz);
            setQuestions(session.questions);
            setSessionPin(session.sessionPin || '');
            setCurrentQIndex(typeof session.currentQIndex === 'number' ? session.currentQIndex : 0);
            setAnswers(session.answers || {});
            if (session.selectedCohort) setSelectedCohort(session.selectedCohort);
            if (session.selectedCourse) setSelectedCourse(session.selectedCourse);
            if (session.matricNo) setMatricNo(session.matricNo);
            setStep(session.step);
          }
        } else {
          localStorage.removeItem(ACTIVE_ASSESSMENT_SESSION_KEY);
        }
      }
    } catch {
      // ignore corrupted storage
    } finally {
      document.documentElement.classList.remove('ces-restoring-quiz');
    }
  }, []);

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

  // Fetch quizzes on cohort change (only depends on selectedCohort to avoid duplicate execution)
  useEffect(() => {
    async function loadQuizzes() {
      const res = await getAvailableQuizzesAction(selectedCohort);
      if (res.success && res.quizzes && res.quizzes.length > 0) {
        setAvailableQuizzes(res.quizzes);
        setSelectedCourse((prev) => {
          if (prev && res.quizzes!.some((q) => q.course_code === prev)) return prev;
          const firstOpen = res.quizzes!.find((q) => q.is_open) || res.quizzes![0];
          return firstOpen.course_code;
        });
      }
    }
    loadQuizzes();
  }, [selectedCohort]);

  // Persist active quiz session to localStorage whenever taking or confirming
  useEffect(() => {
    if (
      (step === 'taking' || step === 'confirm') &&
      candidate &&
      activeQuiz &&
      questions.length > 0
    ) {
      try {
        const sessionData = {
          step,
          candidate,
          activeQuiz,
          questions,
          sessionPin,
          currentQIndex,
          answers,
          selectedCohort,
          selectedCourse,
          matricNo,
          savedAt: Date.now(),
        };
        localStorage.setItem(ACTIVE_ASSESSMENT_SESSION_KEY, JSON.stringify(sessionData));
      } catch {
        // quota exceeded or private mode
      }
    }
  }, [
    step,
    candidate,
    activeQuiz,
    questions,
    sessionPin,
    currentQIndex,
    answers,
    selectedCohort,
    selectedCourse,
    matricNo,
  ]);

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
  const handleVerifyAccess = async (e: FormEvent) => {
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
        cohortType: selectedCohort,
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

  // Cancel from the confirmation step back to the access gate
  const handleCancelConfirm = () => {
    clearActiveAssessmentSession(candidate?.matricNo, activeQuiz?.id);
    setStep('access');
    setCandidate(null);
    setActiveQuiz(null);
    setQuestions([]);
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
        sessionPin,
        answers,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Submission failed. Please contact your instructor.');
        setShowConfirmSubmit(false);
        setLoading(false);
        return;
      }

      // Clear cached session & draft upon successful submission
      clearActiveAssessmentSession(candidate.matricNo, activeQuiz.id);

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
    clearActiveAssessmentSession(candidate?.matricNo, activeQuiz?.id);
    setStep('access');
    setCandidate(null);
    setActiveQuiz(null);
    setQuestions([]);
    setAnswers({});
    setCurrentQIndex(0);
    setErrorMsg(null);
    setSessionPin('');
  };

  // Exit / Abandon active quiz
  const handleAbandonQuiz = () => {
    if (
      window.confirm(
        'Are you sure you want to exit this assessment? Any unsubmitted progress will be discarded.'
      )
    ) {
      clearActiveAssessmentSession(candidate?.matricNo, activeQuiz?.id);
      setStep('access');
      setCandidate(null);
      setActiveQuiz(null);
      setQuestions([]);
      setAnswers({});
      setCurrentQIndex(0);
      setErrorMsg(null);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQIndex];

  return {
    step,
    availableQuizzes,
    selectedCohort,
    setSelectedCohort,
    isOnline,
    matricNo,
    setMatricNo,
    selectedCourse,
    setSelectedCourse,
    sessionPin,
    setSessionPin,
    loading,
    errorMsg,
    candidate,
    activeQuiz,
    questions,
    currentQIndex,
    setCurrentQIndex,
    answers,
    showConfirmSubmit,
    setShowConfirmSubmit,
    resultScore,
    resultMaxScore,
    resultPercentage,
    answeredCount,
    totalQuestions,
    currentQuestion,
    handleSelectOption,
    handleVerifyAccess,
    handleStartQuiz,
    handleCancelConfirm,
    handleSubmitAssessment,
    handleTakeAnother,
    handleAbandonQuiz,
  };
}
