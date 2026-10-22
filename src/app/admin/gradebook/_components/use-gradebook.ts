'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  getCohortGradebookAction,
  overrideStudentScoreAction,
  overrideStudentAttendanceAction,
  type StudentGradebookRow,
} from '@/actions/gradebook';
import type { CohortFilter, GradebookKpis, OverrideTarget, StatusFilter } from './types';

// TODO(audit): hardcoded Regular-cohort semester id; Sunday Cohort toggles are written to
// the wrong semester. Kept as-is so this refactor changes no behaviour.
const HARDCODED_SEMESTER_ID = '8b3ade26-2618-4a55-bcc2-85a11669cedc';

/** State, data loading and mutation handlers for the teacher gradebook. */
export function useGradebook() {
  const [selectedCohort, setSelectedCohort] = useState<CohortFilter>('Regular');
  const [rows, setRows] = useState<StudentGradebookRow[]>([]);
  const [kpis, setKpis] = useState<GradebookKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('ALL');

  const [overrideModal, setOverrideModal] = useState<OverrideTarget | null>(null);
  const [overrideScoreInput, setOverrideScoreInput] = useState<string>('');
  const [overrideReasonInput, setOverrideReasonInput] = useState<string>('');
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const loadGradebook = useCallback(async () => {
    setLoading(true);
    const res = await getCohortGradebookAction(selectedCohort);
    if (res.success && res.rows) {
      setRows(res.rows);
      setKpis(res.kpis || null);
    }
    setLoading(false);
  }, [selectedCohort]);

  useEffect(() => {
    loadGradebook();
  }, [loadGradebook]);

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

  const handleSubmitScoreOverride = async (e: FormEvent) => {
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

  /** Quick attendance status toggle: Attended -> Excused -> Not Attended -> Attended. */
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

    await overrideStudentAttendanceAction({
      studentId,
      semesterId: HARDCODED_SEMESTER_ID,
      courseName,
      status: nextStatus,
    });

    await loadGradebook();
  };

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

  return {
    selectedCohort,
    setSelectedCohort,
    rows,
    kpis,
    loading,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filteredRows,
    loadGradebook,
    overrideModal,
    closeOverrideModal: () => setOverrideModal(null),
    overrideScoreInput,
    setOverrideScoreInput,
    overrideReasonInput,
    setOverrideReasonInput,
    overrideSaving,
    overrideError,
    handleOpenScoreOverride,
    handleSubmitScoreOverride,
    handleToggleAttendance,
  };
}
