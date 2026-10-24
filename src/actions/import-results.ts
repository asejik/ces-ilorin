'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { ADMIN_ROLES, requireStaffUser, type StaffUser } from '@/lib/auth/guard';
import { failWith } from '@/lib/errors';
import { lagosToday } from '@/lib/lagos-time';
import { chunk, fetchAll } from '@/lib/paginate';
import { withinRateLimit } from '@/lib/rate-limit';
import { AUDIT_FAILED_MESSAGE } from '@/lib/audit';
import { CES_CURRICULUM } from '@/lib/curriculum';
import {
  MANDATORY_CLASSES,
  checkUploadedFile,
  parseImportSheet,
  readFirstSheet,
  type ImportAttendance,
} from '@/lib/import-sheet';
import { COHORT_TYPES } from '@/lib/validation/semester';

const COURSE_TITLE = new Map(CES_CURRICULUM.map((c) => [c.code, c.title]));
const MAX_PROBLEM_ROWS = 200;
const MAX_CHANGE_ROWS = 100;

interface ScoreChange {
  studentId: string;
  matricNo: string;
  quizId: string;
  courseCode: string;
  oldScore: number | null;
  newScore: number;
}

interface AttendanceChange {
  studentId: string;
  matricNo: string;
  courseName: string;
  /** Row to update; null when the student has no record for this class yet. */
  existingId: string | null;
  oldStatus: string | null;
  newStatus: ImportAttendance;
}

interface Plan {
  semester: { id: string; name: string; type: string };
  fileName: string;
  columnsFound: string[];
  totalRows: number;
  problems: Array<{ rowNumber: number; matricNo: string; messages: string[] }>;
  validRows: number;
  unchangedRows: number;
  scoreChanges: ScoreChange[];
  attendanceChanges: AttendanceChange[];
}

export interface ImportPreview {
  semesterName: string;
  cohortType: string;
  fileName: string;
  columnsFound: string[];
  totalRows: number;
  validRows: number;
  unchangedRows: number;
  problemRowCount: number;
  problems: Plan['problems'];
  scoreChangeCount: number;
  attendanceChangeCount: number;
  changes: Array<{ matricNo: string; summary: string }>;
}

export interface ImportResult {
  scoresSaved: number;
  attendanceSaved: number;
  skippedRows: number;
}

type Outcome<T> = { success: true; data: T } | { success: false; error: string };

async function guard(): Promise<StaffUser> {
  return requireStaffUser(ADMIN_ROLES);
}

/** Reads the uploaded file and works out exactly what saving it would change. */
async function buildPlan(
  supabase: SupabaseClient,
  formData: FormData
): Promise<Outcome<Plan>> {
  const file = formData.get('file');
  const cohort = String(formData.get('cohort') ?? '');
  if (!(COHORT_TYPES as readonly string[]).includes(cohort)) {
    return { success: false, error: 'Choose a cohort.' };
  }
  if (!(file instanceof File)) return { success: false, error: 'Choose an Excel file to upload.' };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const fileProblem = checkUploadedFile(file.name, file.size, bytes);
  if (fileProblem) return { success: false, error: fileProblem };

  let parsed;
  try {
    parsed = parseImportSheet(readFirstSheet(bytes));
  } catch (err) {
    return failWith('import', err, 'The file could not be read. Make sure it is a valid .xlsx file.');
  }
  if (parsed.fileErrors.length > 0) return { success: false, error: parsed.fileErrors.join(' ') };
  if (parsed.rows.length === 0) return { success: false, error: 'The file has no student rows.' };

  const { data: semester } = await supabase
    .from('ces_semesters')
    .select('id, name, type')
    .eq('type', cohort)
    .eq('is_active', true)
    .maybeSingle();
  if (!semester) return { success: false, error: `There is no active semester for the ${cohort} cohort.` };

  // Students of this semester, found by matric number
  const matrics = Array.from(new Set(parsed.rows.map((r) => r.matricNo).filter(Boolean)));
  const students = new Map<string, { id: string; semester_id: string }>();
  for (const part of chunk(matrics, 100)) {
    const { data, error } = await supabase
      .from('ces_students')
      .select('id, matric_no, semester_id')
      .in('matric_no', part)
      .eq('is_deleted', false);
    if (error) return failWith('import', error, 'Could not look up the students. Please try again.');
    for (const s of data ?? []) students.set(s.matric_no, { id: s.id, semester_id: s.semester_id });
  }

  const { data: quizzes, error: qErr } = await supabase
    .from('ces_quizzes')
    .select('id, course_code, max_score')
    .eq('semester_id', semester.id);
  if (qErr) return failWith('import', qErr, 'Could not load the assessments. Please try again.');
  const quizByCode = new Map((quizzes ?? []).map((q) => [q.course_code, q]));

  const quizIds = (quizzes ?? []).map((q) => q.id);
  const existingScores = new Map<string, number>(); // `${studentId}:${quizId}`
  if (quizIds.length > 0) {
    const { data, error } = await fetchAll((from, to) =>
      supabase
        .from('ces_student_assessments')
        .select('student_id, quiz_id, score')
        .in('quiz_id', quizIds)
        .order('id', { ascending: true })
        .range(from, to)
    );
    if (error) return failWith('import', error, 'Could not read the current scores. Please try again.');
    for (const a of data) existingScores.set(`${a.student_id}:${a.quiz_id}`, Number(a.score));
  }

  const existingAttendance = new Map<string, { id: string; status: string }>(); // `${studentId}:${courseName}`
  {
    const { data, error } = await fetchAll((from, to) =>
      supabase
        .from('ces_attendance_records')
        .select('id, student_id, course_name, status')
        .eq('semester_id', semester.id)
        .in('course_name', [...MANDATORY_CLASSES])
        .order('id', { ascending: true })
        .range(from, to)
    );
    if (error) return failWith('import', error, 'Could not read the current attendance. Please try again.');
    for (const a of data) existingAttendance.set(`${a.student_id}:${a.course_name}`, { id: a.id, status: a.status });
  }

  const plan: Plan = {
    semester: { id: semester.id, name: semester.name, type: semester.type },
    fileName: file.name,
    columnsFound: parsed.columnsFound,
    totalRows: parsed.rows.length,
    problems: [],
    validRows: 0,
    unchangedRows: 0,
    scoreChanges: [],
    attendanceChanges: [],
  };

  for (const row of parsed.rows) {
    const messages = [...row.errors];
    const student = row.matricNo ? students.get(row.matricNo) : undefined;
    if (row.errors.length === 0) {
      if (!student) messages.push('No student with this matric number');
      else if (student.semester_id !== semester.id) {
        messages.push(`Not enrolled in the active ${cohort} semester (${semester.name})`);
      }
    }

    const scoreChanges: ScoreChange[] = [];
    if (messages.length === 0 && student) {
      for (const [code, value] of Object.entries(row.scores)) {
        const quiz = quizByCode.get(code);
        if (!quiz) {
          messages.push(`${COURSE_TITLE.get(code) ?? code} has no assessment set up in this semester`);
        } else if (value > Number(quiz.max_score)) {
          messages.push(`${COURSE_TITLE.get(code) ?? code}: ${value} is above the maximum of ${Number(quiz.max_score)}`);
        } else {
          const old = existingScores.get(`${student.id}:${quiz.id}`) ?? null;
          if (old === null || old !== value) {
            scoreChanges.push({ studentId: student.id, matricNo: row.matricNo, quizId: quiz.id, courseCode: code, oldScore: old, newScore: value });
          }
        }
      }
    }

    if (messages.length > 0 || !student) {
      plan.problems.push({ rowNumber: row.rowNumber, matricNo: row.matricNo, messages });
      continue;
    }

    const attChanges: AttendanceChange[] = [];
    for (const [courseName, status] of Object.entries(row.attendance)) {
      const old = existingAttendance.get(`${student.id}:${courseName}`) ?? null;
      if (old?.status !== status) {
        attChanges.push({
          studentId: student.id,
          matricNo: row.matricNo,
          courseName,
          existingId: old?.id ?? null,
          oldStatus: old?.status ?? null,
          newStatus: status as ImportAttendance,
        });
      }
    }

    plan.validRows++;
    if (scoreChanges.length === 0 && attChanges.length === 0) plan.unchangedRows++;
    plan.scoreChanges.push(...scoreChanges);
    plan.attendanceChanges.push(...attChanges);
  }

  return { success: true, data: plan };
}

/** Admin: shows what an uploaded results file would change. Saves nothing. */
export async function previewResultsImportAction(
  formData: FormData
): Promise<{ success: boolean; preview?: ImportPreview; error?: string }> {
  try {
    await guard();
    const supabase = createAdminClient();
    const res = await buildPlan(supabase, formData);
    if (!res.success) return { success: false, error: res.error };
    const plan = res.data;

    const byStudent = new Map<string, string[]>();
    for (const c of plan.scoreChanges) {
      const text = `${COURSE_TITLE.get(c.courseCode) ?? c.courseCode}: ${c.oldScore === null ? '' : `${c.oldScore} → `}${c.newScore}`;
      byStudent.set(c.matricNo, [...(byStudent.get(c.matricNo) ?? []), text]);
    }
    for (const c of plan.attendanceChanges) {
      const text = `${c.courseName}: ${c.oldStatus ? `${c.oldStatus} → ` : ''}${c.newStatus}`;
      byStudent.set(c.matricNo, [...(byStudent.get(c.matricNo) ?? []), text]);
    }

    return {
      success: true,
      preview: {
        semesterName: plan.semester.name,
        cohortType: plan.semester.type,
        fileName: plan.fileName,
        columnsFound: plan.columnsFound,
        totalRows: plan.totalRows,
        validRows: plan.validRows,
        unchangedRows: plan.unchangedRows,
        problemRowCount: plan.problems.length,
        problems: plan.problems.slice(0, MAX_PROBLEM_ROWS),
        scoreChangeCount: plan.scoreChanges.length,
        attendanceChangeCount: plan.attendanceChanges.length,
        changes: Array.from(byStudent.entries())
          .slice(0, MAX_CHANGE_ROWS)
          .map(([matricNo, parts]) => ({ matricNo, summary: parts.join('; ') })),
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Could not read the file';
    return { success: false, error: msg };
  }
}

/** Admin: saves a results file. The file is checked again here; the browser's preview is never trusted. */
export async function applyResultsImportAction(
  formData: FormData
): Promise<{ success: boolean; result?: ImportResult; error?: string }> {
  try {
    const staff = await guard();
    const supabase = createAdminClient();

    if (!(await withinRateLimit(supabase, `import:${staff.id}`, 20, 3600))) {
      return { success: false, error: 'Too many imports in the last hour. Please wait and try again.' };
    }

    const res = await buildPlan(supabase, formData);
    if (!res.success) return { success: false, error: res.error };
    const plan = res.data;

    const reason = `Excel import: ${plan.fileName} (${lagosToday()})`;
    const nowIso = new Date().toISOString();

    for (const part of chunk(plan.scoreChanges, 200)) {
      const { error } = await supabase.from('ces_student_assessments').upsert(
        part.map((c) => ({
          student_id: c.studentId,
          quiz_id: c.quizId,
          score: c.newScore,
          is_manual_override: true,
          overridden_by: staff.id,
          override_reason: reason,
          submitted_at: nowIso,
        })),
        { onConflict: 'student_id,quiz_id' }
      );
      if (error) return failWith('import', error, 'Saving the scores failed part-way. Upload the same file again to finish.');
    }

    // The attendance table has no unique index on (student, class, semester) in every database,
    // so rows are matched by their own id: existing rows are updated, new ones inserted.
    const today = lagosToday();
    const attendanceRow = (c: AttendanceChange) => ({
      student_id: c.studentId,
      semester_id: plan.semester.id,
      course_name: c.courseName,
      status: c.newStatus,
      session_date: today,
    });
    for (const part of chunk(plan.attendanceChanges.filter((c) => c.existingId), 200)) {
      const { error } = await supabase
        .from('ces_attendance_records')
        .upsert(part.map((c) => ({ id: c.existingId, ...attendanceRow(c) })), { onConflict: 'id' });
      if (error) return failWith('import', error, 'Saving attendance failed part-way. Upload the same file again to finish.');
    }
    for (const part of chunk(plan.attendanceChanges.filter((c) => !c.existingId), 200)) {
      const { error } = await supabase.from('ces_attendance_records').insert(part.map(attendanceRow));
      if (error) return failWith('import', error, 'Saving attendance failed part-way. Upload the same file again to finish.');
    }

    const auditRows = [
      ...plan.scoreChanges.map((c) => ({
        actor_id: staff.id,
        actor_email: staff.email,
        action: 'score_override',
        student_id: c.studentId,
        target_table: 'ces_student_assessments',
        target_id: null,
        old_value: c.oldScore === null ? null : { score: c.oldScore, quiz_id: c.quizId },
        new_value: { score: c.newScore, quiz_id: c.quizId },
        reason,
      })),
      ...plan.attendanceChanges.map((c) => ({
        actor_id: staff.id,
        actor_email: staff.email,
        action: 'attendance_override',
        student_id: c.studentId,
        target_table: 'ces_attendance_records',
        target_id: null,
        old_value: c.oldStatus === null ? null : { status: c.oldStatus, course_name: c.courseName },
        new_value: { status: c.newStatus, course_name: c.courseName },
        reason,
      })),
    ];
    for (const part of chunk(auditRows, 200)) {
      const { error } = await supabase.from('ces_audit_log').insert(part);
      if (error) {
        console.error('[Import] audit log failed:', error.message);
        return { success: false, error: AUDIT_FAILED_MESSAGE };
      }
    }

    return {
      success: true,
      result: {
        scoresSaved: plan.scoreChanges.length,
        attendanceSaved: plan.attendanceChanges.length,
        skippedRows: plan.problems.length,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Import failed';
    return { success: false, error: msg };
  }
}
