'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import {
  scoreOverrideSchema,
  attendanceOverrideSchema,
  type ScoreOverrideInput,
  type AttendanceOverrideInput,
} from '@/lib/validation/attendance';
import {
  calculateCumulativeScore,
  determineGraduationStatus,
  determineHonourClass,
} from '@/lib/academic';
import type { AttendanceStatus, GraduationStatus, HonourClass } from '@/types/database';

export interface StudentGradebookRow {
  studentId: string;
  matricNo: string;
  fullName: string;
  passportUrl: string | null;
  cohortType: string;
  status: string;

  // 8 Quiz Scores (null if unrecorded)
  quizzes: Record<
    string,
    {
      score: number | null;
      maxScore: number;
      isOverride: boolean;
      overrideReason?: string | null;
      quizId: string;
    }
  >;

  // Aggregates
  quizTotal: number | null;
  finalExam: {
    score: number | null;
    maxScore: number;
    isOverride: boolean;
    overrideReason?: string | null;
    quizId: string;
  } | null;
  cumulativeTotal: number | null;

  // Mandatory Attendance
  elementaryPrinciples: AttendanceStatus | null;
  membershipVision: AttendanceStatus | null;

  // Clearance
  graduationStatus: GraduationStatus;
  honourClass: HonourClass | null;
}

export interface CohortGradebookResponse {
  success: boolean;
  error?: string;
  semester?: {
    id: string;
    name: string;
    type: string;
  };
  rows?: StudentGradebookRow[];
  kpis?: {
    totalStudents: number;
    graduatesCount: number;
    pendingCount: number;
    averageScore: number;
  };
}

/**
 * Staff Action: Fetches the complete cohort gradebook roster with quiz scores,
 * exam results, attendance clearance, and preliminary graduation standing.
 */
export async function getCohortGradebookAction(
  cohortType: string = 'Regular'
): Promise<CohortGradebookResponse> {
  try {
    const supabase = createAdminClient();

    // 1. Resolve active semester
    const { data: semester, error: semErr } = await supabase
      .from('ces_semesters')
      .select('id, name, type')
      .eq('type', cohortType)
      .eq('is_active', true)
      .maybeSingle();

    if (semErr || !semester) {
      return { success: false, error: `No active semester found for cohort "${cohortType}".` };
    }

    // 2. Fetch all enrolled students
    const { data: students, error: stuErr } = await supabase
      .from('ces_students')
      .select('id, matric_no, surname, first_name, passport_url, cohort_type, status')
      .eq('semester_id', semester.id)
      .eq('is_deleted', false)
      .order('matric_no', { ascending: true });

    if (stuErr) {
      return { success: false, error: `Failed to fetch students: ${stuErr.message}` };
    }

    // 3. Fetch all quizzes for this semester
    const { data: quizzes, error: qzErr } = await supabase
      .from('ces_quizzes')
      .select('id, course_code, title, assessment_type, max_score')
      .eq('semester_id', semester.id);

    if (qzErr) {
      return { success: false, error: `Failed to fetch quizzes: ${qzErr.message}` };
    }

    const quizCodeMap = new Map((quizzes || []).map((q) => [q.course_code, q]));
    const finalExamQuiz = (quizzes || []).find((q) => q.assessment_type === 'final_exam');

    // 4. Fetch all assessment submissions for this semester
    const quizIds = (quizzes || []).map((q) => q.id);
    let assessmentsData: Array<{
      student_id: string;
      quiz_id: string;
      score: number;
      is_manual_override: boolean;
      override_reason: string | null;
    }> = [];

    if (quizIds.length > 0) {
      const { data: assessments, error: assErr } = await supabase
        .from('ces_student_assessments')
        .select('student_id, quiz_id, score, is_manual_override, override_reason')
        .in('quiz_id', quizIds);

      if (!assErr && assessments) {
        assessmentsData = assessments;
      }
    }

    // 5. Fetch all attendance records for this semester
    const { data: attendanceRecords } = await supabase
      .from('ces_attendance_records')
      .select('student_id, course_name, status')
      .eq('semester_id', semester.id);

    // Group assessments by student_id -> quiz_id
    const studentAssessmentsMap = new Map<
      string,
      Map<string, { score: number; isOverride: boolean; overrideReason: string | null }>
    >();

    for (const a of assessmentsData) {
      if (!studentAssessmentsMap.has(a.student_id)) {
        studentAssessmentsMap.set(a.student_id, new Map());
      }
      studentAssessmentsMap.get(a.student_id)!.set(a.quiz_id, {
        score: Number(a.score),
        isOverride: a.is_manual_override,
        overrideReason: a.override_reason,
      });
    }

    // Group attendance by student_id -> course_name
    const studentAttendanceMap = new Map<string, Map<string, AttendanceStatus>>();
    for (const att of attendanceRecords || []) {
      if (!studentAttendanceMap.has(att.student_id)) {
        studentAttendanceMap.set(att.student_id, new Map());
      }
      studentAttendanceMap.get(att.student_id)!.set(att.course_name, att.status as AttendanceStatus);
    }

    // 6. Build Gradebook Rows
    const modularCourseCodes = [
      'salvation',
      'righteousness',
      'word_of_god',
      'love_walk',
      'service',
      'spiritual_authority',
      'holy_spirit',
      'prayer',
    ];

    let totalScoreSum = 0;
    let scoredStudentsCount = 0;
    let graduatesCount = 0;
    let pendingCount = 0;

    const rows: StudentGradebookRow[] = (students || []).map((stu) => {
      const stuScores = studentAssessmentsMap.get(stu.id);
      const stuAtt = studentAttendanceMap.get(stu.id);

      // Modular Quizzes
      const quizzesObj: StudentGradebookRow['quizzes'] = {};
      let quizSum = 0;
      let allQuizzesComplete = true;

      for (const code of modularCourseCodes) {
        const qDef = quizCodeMap.get(code);
        const qScoreInfo = qDef && stuScores ? stuScores.get(qDef.id) : undefined;

        if (qDef) {
          const score = qScoreInfo !== undefined ? qScoreInfo.score : null;
          if (score !== null) {
            quizSum += score;
          } else {
            allQuizzesComplete = false;
          }

          quizzesObj[code] = {
            score,
            maxScore: Number(qDef.max_score),
            isOverride: qScoreInfo?.isOverride ?? false,
            overrideReason: qScoreInfo?.overrideReason ?? null,
            quizId: qDef.id,
          };
        }
      }

      // Final Exam
      let finalExamObj: StudentGradebookRow['finalExam'] = null;
      let examScore: number | null = null;
      if (finalExamQuiz) {
        const examScoreInfo = stuScores ? stuScores.get(finalExamQuiz.id) : undefined;
        examScore = examScoreInfo !== undefined ? examScoreInfo.score : null;
        finalExamObj = {
          score: examScore,
          maxScore: Number(finalExamQuiz.max_score),
          isOverride: examScoreInfo?.isOverride ?? false,
          overrideReason: examScoreInfo?.overrideReason ?? null,
          quizId: finalExamQuiz.id,
        };
      }

      // Calculations
      const quizTotal = allQuizzesComplete ? Number(quizSum.toFixed(2)) : null;
      const cumulativeTotal = calculateCumulativeScore(quizTotal, examScore);

      // Attendance
      const elementaryPrinciples = stuAtt?.get('Elementary Principles') ?? null;
      const membershipVision = stuAtt?.get('Membership & Vision Class') ?? null;

      // Graduation clearance
      const graduationStatus = determineGraduationStatus({
        cumulativeTotal,
        elementaryPrinciples,
        membershipVision,
        allQuizzesEntered: allQuizzesComplete,
        examEntered: examScore !== null,
      });

      const honourClass = determineHonourClass(cumulativeTotal);

      if (cumulativeTotal !== null) {
        totalScoreSum += cumulativeTotal;
        scoredStudentsCount++;
      }

      if (graduationStatus === '✅ GRADUATE') {
        graduatesCount++;
      } else if (graduationStatus === '⏳ PENDING') {
        pendingCount++;
      }

      return {
        studentId: stu.id,
        matricNo: stu.matric_no,
        fullName: `${stu.first_name} ${stu.surname}`,
        passportUrl: stu.passport_url,
        cohortType: stu.cohort_type,
        status: stu.status,
        quizzes: quizzesObj,
        quizTotal,
        finalExam: finalExamObj,
        cumulativeTotal,
        elementaryPrinciples,
        membershipVision,
        graduationStatus,
        honourClass,
      };
    });

    const averageScore =
      scoredStudentsCount > 0 ? Number((totalScoreSum / scoredStudentsCount).toFixed(1)) : 0;

    return {
      success: true,
      semester: {
        id: semester.id,
        name: semester.name,
        type: semester.type,
      },
      rows,
      kpis: {
        totalStudents: rows.length,
        graduatesCount,
        pendingCount,
        averageScore,
      },
    };
  } catch (err: unknown) {
    console.error('[Gradebook Error]:', err);
    const msg = err instanceof Error ? err.message : 'Failed to retrieve gradebook data';
    return { success: false, error: msg };
  }
}

/**
 * Staff Action: Manual Score Override & Emergency Offline Entry
 * Audited with required reason and staff credentials.
 */
export async function overrideStudentScoreAction(
  input: ScoreOverrideInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const parseResult = scoreOverrideSchema.safeParse(input);
    if (!parseResult.success) {
      const firstErr = parseResult.error.errors[0]?.message || 'Invalid override parameters';
      return { success: false, error: firstErr };
    }

    const { studentId, quizId, newScore, reason } = parseResult.data;
    const supabase = createAdminClient();

    // Check if score already exists
    const { data: existing } = await supabase
      .from('ces_student_assessments')
      .select('id')
      .eq('student_id', studentId)
      .eq('quiz_id', quizId)
      .maybeSingle();

    if (existing) {
      // Update with override flag and reason
      const { error: updErr } = await supabase
        .from('ces_student_assessments')
        .update({
          score: newScore,
          is_manual_override: true,
          override_reason: reason,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updErr) {
        return { success: false, error: `Failed to update score: ${updErr.message}` };
      }
    } else {
      // Insert manual offline score
      const { error: insErr } = await supabase
        .from('ces_student_assessments')
        .insert({
          student_id: studentId,
          quiz_id: quizId,
          score: newScore,
          is_manual_override: true,
          override_reason: reason,
        });

      if (insErr) {
        return { success: false, error: `Failed to record override score: ${insErr.message}` };
      }
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to record manual override';
    return { success: false, error: msg };
  }
}

/**
 * Staff Action: Quick Attendance Status Override
 */
export async function overrideStudentAttendanceAction(
  input: AttendanceOverrideInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const parseResult = attendanceOverrideSchema.safeParse(input);
    if (!parseResult.success) {
      const firstErr = parseResult.error.errors[0]?.message || 'Invalid attendance parameters';
      return { success: false, error: firstErr };
    }

    const { studentId, semesterId, courseName, status } = parseResult.data;
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from('ces_attendance_records')
      .select('id')
      .eq('student_id', studentId)
      .eq('semester_id', semesterId)
      .eq('course_name', courseName)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('ces_attendance_records')
        .update({
          status,
          session_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', existing.id);

      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase
        .from('ces_attendance_records')
        .insert({
          student_id: studentId,
          semester_id: semesterId,
          course_name: courseName,
          status,
          session_date: new Date().toISOString().split('T')[0],
        });

      if (error) return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to override attendance';
    return { success: false, error: msg };
  }
}
