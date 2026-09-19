'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Unlock,
  Lock,
  Save,
  Users,
  FileQuestion,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { getTeacherQuizzesAction, updateQuizSessionAction } from '@/actions/assessment';

interface QuizStat {
  id: string;
  course_code: string;
  title: string;
  assessment_type: 'quiz' | 'final_exam';
  max_score: number;
  session_pin: string | null;
  is_open: boolean;
  submissionCount: number;
  questionCount: number;
}

export default function TeacherQuizzesPage() {
  const [selectedCohort, setSelectedCohort] = useState<'Regular' | 'Sunday Cohort'>('Regular');
  const [quizzes, setQuizzes] = useState<QuizStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<{ id: string; msg: string; isError?: boolean } | null>(null);

  // Local editable PIN and open state
  const [editPins, setEditPins] = useState<Record<string, string>>({});
  const [editOpen, setEditOpen] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    setLoading(true);
    const res = await getTeacherQuizzesAction(selectedCohort);
    if (res.success && res.quizzes) {
      setQuizzes(res.quizzes);
      const pins: Record<string, string> = {};
      const openStates: Record<string, boolean> = {};
      for (const q of res.quizzes) {
        pins[q.id] = q.session_pin || '';
        openStates[q.id] = q.is_open;
      }
      setEditPins(pins);
      setEditOpen(openStates);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedCohort]);

  const handleToggleOpen = (quizId: string) => {
    setEditOpen((prev) => ({ ...prev, [quizId]: !prev[quizId] }));
  };

  const handlePinChange = (quizId: string, val: string) => {
    setEditPins((prev) => ({ ...prev, [quizId]: val.toUpperCase() }));
  };

  const handleSaveQuiz = async (quizId: string) => {
    setSavingId(quizId);
    setStatusNotice(null);

    const pin = editPins[quizId] || '';
    const isOpen = editOpen[quizId] ?? false;

    if (pin.trim().length < 3) {
      setStatusNotice({ id: quizId, msg: 'PIN must be at least 3 characters', isError: true });
      setSavingId(null);
      return;
    }

    try {
      const res = await updateQuizSessionAction({
        quizId,
        sessionPin: pin,
        isOpen,
      });

      if (res.success) {
        setStatusNotice({ id: quizId, msg: 'Saved!' });
        // Update local quiz array
        setQuizzes((prev) =>
          prev.map((q) => (q.id === quizId ? { ...q, session_pin: pin, is_open: isOpen } : q))
        );
        setTimeout(() => setStatusNotice(null), 3000);
      } else {
        setStatusNotice({ id: quizId, msg: res.error || 'Failed to save', isError: true });
      }
    } catch {
      setStatusNotice({ id: quizId, msg: 'Error saving session', isError: true });
    } finally {
      setSavingId(null);
    }
  };

  const totalSubmissions = quizzes.reduce((sum, q) => sum + q.submissionCount, 0);
  const openCount = quizzes.filter((q) => editOpen[q.id]).length;

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="border-b border-ink-200 bg-surface px-4 sm:px-8 py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
                  Quiz Sessions & PIN Manager
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-solar-100 text-solar-800">
                  Teacher Control
                </span>
              </div>
              <p className="text-xs text-ink-500">
                Set session PINs, toggle active quiz availability, and monitor live submissions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="h-9 px-3 rounded-lg border border-ink-200 text-xs font-semibold text-ink-700 hover:bg-canvas transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              href="/assess"
              target="_blank"
              className="h-9 px-3 rounded-lg bg-ink-950 text-white text-xs font-semibold hover:bg-ink-800 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <GraduationCap className="w-3.5 h-3.5 text-solar-400" />
              <span>Student Room ↗</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Cohort Selector & Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Cohort Tabs */}
          <div className="bg-surface rounded-2xl border border-ink-200 p-4 flex flex-col justify-between shadow-xs">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-2">
              Active Cohort
            </span>
            <div className="grid grid-cols-2 gap-1.5 bg-canvas p-1 rounded-xl border border-ink-200">
              <button
                type="button"
                onClick={() => setSelectedCohort('Regular')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedCohort === 'Regular'
                    ? 'bg-surface text-ink-950 shadow-xs border border-ink-200'
                    : 'text-ink-600 hover:text-ink-950'
                }`}
              >
                Regular
              </button>
              <button
                type="button"
                onClick={() => setSelectedCohort('Sunday Cohort')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedCohort === 'Sunday Cohort'
                    ? 'bg-sunday-500 text-white shadow-xs'
                    : 'text-ink-600 hover:text-sunday-600'
                }`}
              >
                Sunday
              </button>
            </div>
          </div>

          {/* Stat 1: Total Courses */}
          <div className="bg-surface rounded-2xl border border-ink-200 p-4 shadow-xs">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1">
              Total Assessments
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-heading font-extrabold text-2xl text-ink-950">{quizzes.length}</span>
              <span className="text-xs text-ink-500">(8 Quizzes + 1 Final)</span>
            </div>
            <span className="text-[11px] text-ink-400 mt-1 block">Maximum 100 cumulative marks</span>
          </div>

          {/* Stat 2: Open Sessions */}
          <div className="bg-surface rounded-2xl border border-ink-200 p-4 shadow-xs">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1">
              Active Sessions
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-heading font-extrabold text-2xl text-status-graduate-dot">
                {openCount}
              </span>
              <span className="text-xs text-ink-500">of {quizzes.length} Open</span>
            </div>
            <span className="text-[11px] text-ink-400 mt-1 block">Visible to student intake</span>
          </div>

          {/* Stat 3: Total Submissions */}
          <div className="bg-surface rounded-2xl border border-ink-200 p-4 shadow-xs">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1">
              Total Submissions
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-heading font-extrabold text-2xl text-solar-700">
                {totalSubmissions}
              </span>
              <span className="text-xs text-ink-500">Graded Answers</span>
            </div>
            <span className="text-[11px] text-ink-400 mt-1 block">Recorded in gradebook</span>
          </div>
        </div>

        {/* Quizzes List Table */}
        <div className="bg-surface rounded-2xl border border-ink-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-ink-200 flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-base text-ink-950">
                Course Assessment Grid ({selectedCohort})
              </h2>
              <p className="text-xs text-ink-500">
                Changes to Session PIN and Open status take effect immediately for student logins.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-ink-500 flex items-center justify-center gap-2">
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-solar-500 border-t-transparent" />
              <span>Loading curriculum quizzes...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-canvas border-b border-ink-200 text-ink-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Max Score</th>
                    <th className="py-3 px-3">Questions</th>
                    <th className="py-3 px-3">Submissions</th>
                    <th className="py-3 px-3">Session PIN</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {quizzes.map((quiz) => {
                    const currentPin = editPins[quiz.id] ?? '';
                    const isOpen = editOpen[quiz.id] ?? false;
                    const isSaving = savingId === quiz.id;
                    const notice = statusNotice?.id === quiz.id ? statusNotice : null;

                    return (
                      <tr key={quiz.id} className="hover:bg-canvas/60 transition-colors">
                        {/* Course Name */}
                        <td className="py-3.5 px-4 font-semibold text-ink-950">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-ink-400 bg-ink-100 px-1.5 py-0.5 rounded">
                              {quiz.course_code}
                            </span>
                            <span>{quiz.title}</span>
                          </div>
                        </td>

                        {/* Assessment Type */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              quiz.assessment_type === 'final_exam'
                                ? 'bg-solar-100 text-solar-800 border border-solar-300'
                                : 'bg-ink-100 text-ink-700'
                            }`}
                          >
                            {quiz.assessment_type === 'final_exam' ? 'Final Exam' : 'Quiz'}
                          </span>
                        </td>

                        {/* Max Score */}
                        <td className="py-3.5 px-3 font-mono font-bold text-ink-900">
                          {quiz.max_score} Marks
                        </td>

                        {/* Question Count */}
                        <td className="py-3.5 px-3 text-ink-600">
                          <span className="inline-flex items-center gap-1">
                            <FileQuestion className="w-3.5 h-3.5 text-ink-400" />
                            <span>{quiz.questionCount} Questions</span>
                          </span>
                        </td>

                        {/* Submissions Count */}
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center gap-1 font-semibold text-ink-800">
                            <Users className="w-3.5 h-3.5 text-solar-500" />
                            <span>{quiz.submissionCount}</span>
                          </span>
                        </td>

                        {/* Session PIN Input */}
                        <td className="py-3.5 px-3">
                          <input
                            type="text"
                            value={currentPin}
                            onChange={(e) => handlePinChange(quiz.id, e.target.value)}
                            placeholder="PIN"
                            maxLength={16}
                            className="w-24 h-8 px-2 rounded-lg border border-ink-200 bg-surface font-mono font-bold text-xs uppercase tracking-wider text-ink-950 focus:ring-2 focus:ring-solar-500 focus:outline-none"
                          />
                        </td>

                        {/* Status Toggle Button */}
                        <td className="py-3.5 px-3">
                          <button
                            type="button"
                            onClick={() => handleToggleOpen(quiz.id)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 transition-all ${
                              isOpen
                                ? 'bg-status-graduate-bg text-status-graduate-text border border-status-graduate-dot/30 hover:bg-status-graduate-bg/80'
                                : 'bg-status-notyet-bg text-status-notyet-text border border-status-notyet-dot/30 hover:bg-status-notyet-bg/80'
                            }`}
                          >
                            {isOpen ? (
                              <>
                                <Unlock className="w-3 h-3 text-status-graduate-dot" />
                                <span>OPEN</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 text-status-notyet-dot" />
                                <span>CLOSED</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Action: Save */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {notice && (
                              <span
                                className={`text-[11px] font-bold ${
                                  notice.isError ? 'text-status-notyet-dot' : 'text-status-graduate-dot'
                                }`}
                              >
                                {notice.msg}
                              </span>
                            )}
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => handleSaveQuiz(quiz.id)}
                              className="h-8 px-3 rounded-lg bg-ink-950 text-white text-xs font-bold hover:bg-ink-900 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                            >
                              {isSaving ? (
                                <span className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                              ) : (
                                <>
                                  <Save className="w-3 h-3 text-solar-400" />
                                  <span>Save</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
