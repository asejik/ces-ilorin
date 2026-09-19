'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Edit3,
  Save,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  getCohortGradebookAction,
  overrideStudentScoreAction,
  overrideStudentAttendanceAction,
  type StudentGradebookRow,
} from '@/actions/gradebook';

const QUIZ_COLUMNS = [
  { code: 'salvation', short: 'Salv', name: 'Salvation' },
  { code: 'righteousness', short: 'Rght', name: 'Righteousness' },
  { code: 'word_of_god', short: 'Word', name: 'Word of God' },
  { code: 'love_walk', short: 'Love', name: 'Love Walk' },
  { code: 'service', short: 'Serv', name: 'Service' },
  { code: 'spiritual_authority', short: 'Auth', name: 'Authority' },
  { code: 'holy_spirit', short: 'Spir', name: 'Holy Spirit' },
  { code: 'prayer', short: 'Pray', name: 'Prayer' },
];

export default function GradebookPage() {
  const [selectedCohort, setSelectedCohort] = useState<'Regular' | 'Sunday Cohort'>('Regular');
  const [rows, setRows] = useState<StudentGradebookRow[]>([]);
  const [kpis, setKpis] = useState<{
    totalStudents: number;
    graduatesCount: number;
    pendingCount: number;
    averageScore: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'GRADUATE' | 'PENDING' | 'NOT_YET'>('ALL');

  // Override Modal state
  const [overrideModal, setOverrideModal] = useState<{
    studentId: string;
    studentName: string;
    matricNo: string;
    quizId: string;
    courseTitle: string;
    currentScore: number | null;
    maxScore: number;
  } | null>(null);

  const [overrideScoreInput, setOverrideScoreInput] = useState<string>('');
  const [overrideReasonInput, setOverrideReasonInput] = useState<string>('');
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const loadGradebook = async () => {
    setLoading(true);
    const res = await getCohortGradebookAction(selectedCohort);
    if (res.success && res.rows) {
      setRows(res.rows);
      setKpis(res.kpis || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadGradebook();
  }, [selectedCohort]);

  // Open Score Override Modal
  const handleOpenScoreOverride = (
    student: StudentGradebookRow,
    quizId: string,
    courseTitle: string,
    currentScore: number | null,
    maxScore: number
  ) => {
    setOverrideModal({
      studentId: student.studentId,
      studentName: student.fullName,
      matricNo: student.matricNo,
      quizId,
      courseTitle,
      currentScore,
      maxScore,
    });
    setOverrideScoreInput(currentScore !== null ? String(currentScore) : '');
    setOverrideReasonInput('');
    setOverrideError(null);
  };

  // Submit Score Override
  const handleSubmitScoreOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModal) return;

    setOverrideError(null);
    const numScore = parseFloat(overrideScoreInput);

    if (isNaN(numScore)) {
      setOverrideError('Please enter a valid numeric score');
      return;
    }

    if (numScore < 0 || numScore > overrideModal.maxScore) {
      setOverrideError(`Score must be between 0 and ${overrideModal.maxScore}`);
      return;
    }

    if (overrideReasonInput.trim().length < 5) {
      setOverrideError('A clear reason (minimum 5 characters) is required for audit trail');
      return;
    }

    setOverrideSaving(true);
    try {
      const res = await overrideStudentScoreAction({
        studentId: overrideModal.studentId,
        quizId: overrideModal.quizId,
        newScore: numScore,
        maxScore: overrideModal.maxScore,
        reason: overrideReasonInput,
      });

      if (!res.success) {
        setOverrideError(res.error || 'Failed to save override');
        setOverrideSaving(false);
        return;
      }

      setOverrideModal(null);
      await loadGradebook();
    } catch {
      setOverrideError('Network error while saving override');
    } finally {
      setOverrideSaving(false);
    }
  };

  // Quick Attendance Status Toggle
  const handleToggleAttendance = async (
    studentId: string,
    courseName: string,
    currentStatus: string | null
  ) => {
    const nextStatus =
      currentStatus === 'Attended'
        ? 'Excused'
        : currentStatus === 'Excused'
        ? 'Not Attended'
        : 'Attended';

    // Optimistic update
    setRows((prev) =>
      prev.map((r) => {
        if (r.studentId === studentId) {
          if (courseName === 'Elementary Principles') {
            return { ...r, elementaryPrinciples: nextStatus };
          }
          if (courseName === 'Membership & Vision Class') {
            return { ...r, membershipVision: nextStatus };
          }
        }
        return r;
      })
    );

    // Persist to server
    const currentSemesterId = '8b3ade26-2618-4a55-bcc2-85a11669cedc'; // or resolve dynamically
    await overrideStudentAttendanceAction({
      studentId,
      semesterId: currentSemesterId,
      courseName,
      status: nextStatus,
    });

    await loadGradebook();
  };

  // Filtered Rows
  const filteredRows = rows.filter((r) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      r.fullName.toLowerCase().includes(query) ||
      r.matricNo.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (filterStatus === 'GRADUATE') return r.graduationStatus === '✅ GRADUATE';
    if (filterStatus === 'PENDING') return r.graduationStatus === '⏳ PENDING';
    if (filterStatus === 'NOT_YET') return r.graduationStatus === '❌ NOT YET';

    return true;
  });

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
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
              onClick={loadGradebook}
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* KPI Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Active Cohort Switcher */}
          <div className="bg-surface rounded-2xl border border-ink-200 p-4 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-2">
              Select Cohort
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

          {/* Enrolled Students */}
          <div className="bg-surface rounded-2xl border border-ink-200 p-4 shadow-xs">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1">
              Enrolled Students
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-heading font-extrabold text-2xl text-ink-950">
                {kpis?.totalStudents ?? 0}
              </span>
              <span className="text-xs text-ink-500">Registered</span>
            </div>
            <span className="text-[11px] text-ink-400 mt-1 block">Active matriculated students</span>
          </div>

          {/* Cleared Graduates */}
          <div className="bg-surface rounded-2xl border border-ink-200 p-4 shadow-xs">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1">
              Cleared for Graduation
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-heading font-extrabold text-2xl text-status-graduate-dot">
                {kpis?.graduatesCount ?? 0}
              </span>
              <span className="text-xs text-ink-500">Graduates</span>
            </div>
            <span className="text-[11px] text-ink-400 mt-1 block">Total ≥ 50 & 100% Attendance</span>
          </div>

          {/* Pending Clearance */}
          <div className="bg-surface rounded-2xl border border-ink-200 p-4 shadow-xs">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-1">
              Pending Evaluation
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-heading font-extrabold text-2xl text-status-pending-text">
                {kpis?.pendingCount ?? 0}
              </span>
              <span className="text-xs text-ink-500">Incomplete</span>
            </div>
            <span className="text-[11px] text-ink-400 mt-1 block">Missing quizzes or exam</span>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="bg-surface rounded-2xl border border-ink-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-ink-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by student name or matric..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-ink-200 bg-canvas text-xs focus:ring-2 focus:ring-solar-500 focus:bg-surface focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'ALL'
                  ? 'bg-ink-950 text-white'
                  : 'text-ink-600 hover:bg-canvas'
              }`}
            >
              All ({rows.length})
            </button>
            <button
              onClick={() => setFilterStatus('GRADUATE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'GRADUATE'
                  ? 'bg-status-graduate-bg text-status-graduate-text border border-status-graduate-dot/30'
                  : 'text-ink-600 hover:bg-canvas'
              }`}
            >
              Graduates
            </button>
            <button
              onClick={() => setFilterStatus('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'PENDING'
                  ? 'bg-status-pending-bg text-status-pending-text border border-status-pending-dot/30'
                  : 'text-ink-600 hover:bg-canvas'
              }`}
            >
              Pending
            </button>
          </div>
        </div>

        {/* Roster Table */}
        <div className="bg-surface rounded-2xl border border-ink-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-xs text-ink-500 flex items-center justify-center gap-2">
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-solar-500 border-t-transparent" />
              <span>Compiling gradebook scores and clearance...</span>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-500">
              No student records match the selected cohort and search filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-canvas border-b border-ink-200 text-ink-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 sticky left-0 bg-canvas z-10">Student</th>
                    <th className="py-3 px-2">Cohort</th>
                    {QUIZ_COLUMNS.map((col) => (
                      <th key={col.code} className="py-3 px-2 text-center" title={col.name}>
                        {col.short} (/5)
                      </th>
                    ))}
                    <th className="py-3 px-2 text-center bg-ink-50/70 font-extrabold text-ink-950">
                      Quiz Total (/40)
                    </th>
                    <th className="py-3 px-2 text-center font-extrabold text-ink-950">
                      Exam (/60)
                    </th>
                    <th className="py-3 px-2 text-center font-extrabold text-ink-950 bg-solar-50/60">
                      Total (/100)
                    </th>
                    <th className="py-3 px-2 text-center" title="Elementary Principles">
                      Elem Princ
                    </th>
                    <th className="py-3 px-2 text-center" title="Membership & Vision Class">
                      Memb Class
                    </th>
                    <th className="py-3 px-3 text-center">Clearance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {filteredRows.map((row) => (
                    <tr key={row.studentId} className="hover:bg-canvas/50 transition-colors">
                      {/* Student Info */}
                      <td className="py-2.5 px-3 sticky left-0 bg-surface z-10">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-ink-100 text-ink-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {row.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-ink-950 block text-xs leading-tight">
                              {row.fullName}
                            </span>
                            <span className="font-mono text-[11px] text-ink-500 leading-tight">
                              {row.matricNo}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cohort Badge */}
                      <td className="py-2.5 px-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.cohortType === 'Sunday Cohort'
                              ? 'bg-sunday-100 text-sunday-700 border border-sunday-300'
                              : 'bg-ink-100 text-ink-800'
                          }`}
                        >
                          {row.cohortType === 'Sunday Cohort' ? 'Sunday' : 'Regular'}
                        </span>
                      </td>

                      {/* 8 Quiz Cells */}
                      {QUIZ_COLUMNS.map((col) => {
                        const q = row.quizzes[col.code];
                        if (!q) {
                          return (
                            <td key={col.code} className="py-2.5 px-2 text-center text-ink-300">
                              -
                            </td>
                          );
                        }

                        return (
                          <td key={col.code} className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenScoreOverride(
                                  row,
                                  q.quizId,
                                  col.name,
                                  q.score,
                                  q.maxScore
                                )
                              }
                              className={`px-1.5 py-0.5 rounded font-mono font-bold text-xs inline-flex items-center gap-1 hover:ring-2 hover:ring-solar-400 transition-all ${
                                q.score !== null
                                  ? q.isOverride
                                    ? 'bg-solar-100 text-solar-900 border border-solar-300'
                                    : 'bg-ink-100 text-ink-950'
                                  : 'text-ink-400 hover:bg-canvas'
                              }`}
                              title={
                                q.isOverride
                                  ? `Manually overridden: ${q.overrideReason || 'No reason provided'}`
                                  : 'Click to edit or manually record score'
                              }
                            >
                              <span>{q.score !== null ? q.score.toFixed(1) : '-'}</span>
                              {q.isOverride && (
                                <span className="text-[9px] text-solar-700 font-extrabold uppercase">
                                  M
                                </span>
                              )}
                            </button>
                          </td>
                        );
                      })}

                      {/* Quiz Total */}
                      <td className="py-2.5 px-2 text-center font-mono font-bold bg-ink-50/70 text-ink-950">
                        {row.quizTotal !== null ? row.quizTotal.toFixed(1) : '-'}
                      </td>

                      {/* Final Exam */}
                      <td className="py-2.5 px-2 text-center">
                        {row.finalExam ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenScoreOverride(
                                row,
                                row.finalExam!.quizId,
                                'Final Examination',
                                row.finalExam!.score,
                                row.finalExam!.maxScore
                              )
                            }
                            className={`px-2 py-0.5 rounded font-mono font-bold text-xs inline-flex items-center gap-1 hover:ring-2 hover:ring-solar-400 transition-all ${
                              row.finalExam.score !== null
                                ? row.finalExam.isOverride
                                  ? 'bg-solar-100 text-solar-900 border border-solar-300'
                                  : 'bg-ink-100 text-ink-950'
                                : 'text-ink-400 hover:bg-canvas'
                            }`}
                          >
                            <span>
                              {row.finalExam.score !== null
                                ? row.finalExam.score.toFixed(1)
                                : '-'}
                            </span>
                            {row.finalExam.isOverride && (
                              <span className="text-[9px] text-solar-700 font-extrabold uppercase">
                                M
                              </span>
                            )}
                          </button>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Cumulative Total */}
                      <td className="py-2.5 px-2 text-center font-mono font-extrabold bg-solar-50/60 text-ink-950">
                        {row.cumulativeTotal !== null ? (
                          <span
                            className={
                              row.cumulativeTotal >= 85
                                ? 'text-solar-800'
                                : row.cumulativeTotal >= 50
                                ? 'text-status-graduate-text'
                                : 'text-status-notyet-dot'
                            }
                          >
                            {row.cumulativeTotal.toFixed(1)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Attendance: Elementary Principles */}
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleAttendance(
                              row.studentId,
                              'Elementary Principles',
                              row.elementaryPrinciples
                            )
                          }
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                            row.elementaryPrinciples === 'Attended'
                              ? 'bg-status-graduate-bg text-status-graduate-text border border-status-graduate-dot/30'
                              : row.elementaryPrinciples === 'Excused'
                              ? 'bg-ink-100 text-ink-700'
                              : row.elementaryPrinciples === 'Not Attended'
                              ? 'bg-status-notyet-bg text-status-notyet-text'
                              : 'bg-canvas text-ink-400 border border-ink-200'
                          }`}
                          title="Click to toggle attendance status"
                        >
                          {row.elementaryPrinciples || 'Unmarked'}
                        </button>
                      </td>

                      {/* Attendance: Membership & Vision */}
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleAttendance(
                              row.studentId,
                              'Membership & Vision Class',
                              row.membershipVision
                            )
                          }
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                            row.membershipVision === 'Attended'
                              ? 'bg-status-graduate-bg text-status-graduate-text border border-status-graduate-dot/30'
                              : row.membershipVision === 'Excused'
                              ? 'bg-ink-100 text-ink-700'
                              : row.membershipVision === 'Not Attended'
                              ? 'bg-status-notyet-bg text-status-notyet-text'
                              : 'bg-canvas text-ink-400 border border-ink-200'
                          }`}
                          title="Click to toggle attendance status"
                        >
                          {row.membershipVision || 'Unmarked'}
                        </button>
                      </td>

                      {/* Graduation Clearance Status */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                            row.graduationStatus === '✅ GRADUATE'
                              ? 'bg-status-graduate-bg text-status-graduate-text border border-status-graduate-dot/30'
                              : row.graduationStatus === '⏳ PENDING'
                              ? 'bg-status-pending-bg text-status-pending-text border border-status-pending-dot/30'
                              : 'bg-status-notyet-bg text-status-notyet-text border border-status-notyet-dot/30'
                          }`}
                        >
                          {row.graduationStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Manual Score Override Modal */}
      {overrideModal && (
        <div className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-ink-200 shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-ink-100 mb-4">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-solar-600" />
                <h3 className="font-heading font-bold text-sm text-ink-950">
                  Manual Score Override
                </h3>
              </div>
              <button
                onClick={() => setOverrideModal(null)}
                className="text-ink-400 hover:text-ink-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitScoreOverride} className="space-y-4">
              <div className="bg-canvas p-3 rounded-xl border border-ink-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-500">Student:</span>
                  <strong className="text-ink-950">{overrideModal.studentName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">Matric:</span>
                  <span className="font-mono font-bold text-ink-950">
                    {overrideModal.matricNo}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">Course Assessment:</span>
                  <strong className="text-ink-950">{overrideModal.courseTitle}</strong>
                </div>
                <div className="flex justify-between border-t border-ink-200 pt-1">
                  <span className="text-ink-500">Max Marks Allowed:</span>
                  <strong className="text-solar-700">{overrideModal.maxScore} Marks</strong>
                </div>
              </div>

              {overrideError && (
                <div className="p-3 rounded-lg bg-status-notyet-bg text-status-notyet-text text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{overrideError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  New Score (/ {overrideModal.maxScore})
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={overrideModal.maxScore}
                  value={overrideScoreInput}
                  onChange={(e) => setOverrideScoreInput(e.target.value)}
                  placeholder={`e.g. ${overrideModal.maxScore}`}
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
                  value={overrideReasonInput}
                  onChange={(e) => setOverrideReasonInput(e.target.value)}
                  placeholder="e.g. Make-up test taken on paper in church office due to technical error..."
                  className="w-full p-2.5 rounded-xl border border-ink-200 text-xs text-ink-950 focus:ring-2 focus:ring-solar-500 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideModal(null)}
                  className="flex-1 h-10 rounded-xl border border-ink-300 text-xs font-bold text-ink-700 hover:bg-canvas transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideSaving}
                  className="flex-1 h-10 rounded-xl bg-ink-950 text-white text-xs font-bold hover:bg-ink-900 transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {overrideSaving ? (
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
      )}
    </div>
  );
}
