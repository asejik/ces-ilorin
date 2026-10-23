'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { failWith } from '@/lib/errors';
import { lagosToday } from '@/lib/lagos-time';
import { fetchAll } from '@/lib/paginate';
import { requireStaffUser } from '@/lib/auth/guard';
import {
  ATTENDANCE_COURSE_NAMES,
  attendanceCheckinSchema,
  type AttendanceCheckinInput,
} from '@/lib/validation/attendance';
import { codesMatch, generateCode } from '@/lib/codes';
import { getClientIp, TOO_MANY_ATTEMPTS, withinRateLimit } from '@/lib/rate-limit';

const CHECKIN_REFUSED =
  'Matric number or class code is incorrect, or check-in is not open for this class. Please check with your teacher.';

export interface AttendanceCheckinResult {
  success: boolean;
  error?: string;
  studentName?: string;
  matricNo?: string;
  cohortType?: string;
  courseName?: string;
  sessionDate?: string;
  rating?: number;
}

export interface AttendanceFeedbackItem {
  id: string;
  courseName: string;
  studentName: string;
  matricNo: string;
  deliveryRating: number | null;
  deliveryFeedback: string | null;
  sessionDate: string;
  loggedAt: string;
}

export interface AttendanceSummaryStats {
  totalCheckins: number;
  averageRating: number;
  ratingCounts: Record<number, number>; // 1 -> count, 2 -> count...
  feedbacks: AttendanceFeedbackItem[];
}

/**
 * Student Check-in Action:
 * Records class attendance and optional teaching delivery rating and feedback.
 */
export async function submitAttendanceCheckinAction(
  input: AttendanceCheckinInput
): Promise<AttendanceCheckinResult> {
  try {
    const parseResult = attendanceCheckinSchema.safeParse(input);
    if (!parseResult.success) {
      const firstErr = parseResult.error.errors[0]?.message || 'Invalid attendance parameters';
      return { success: false, error: firstErr };
    }

    const { matricNo, courseName, classCode, sessionDate, deliveryRating, deliveryFeedback } =
      parseResult.data;
    const today = lagosToday();
    const finalDate = sessionDate || today;

    // Prevent future dates (compared in Nigerian time)
    if (finalDate > today) {
      return {
        success: false,
        error: 'Class attendance date cannot be in the future. Please select today or a past class date.',
      };
    }

    const supabase = createAdminClient();

    // 0. Throttle guessing: per network address and per matric number
    const ip = await getClientIp();
    const allowed =
      // Generous per-address limit: a whole class checks in from one shared network.
      (await withinRateLimit(supabase, `att:ip:${ip}`, 300, 600)) &&
      (await withinRateLimit(supabase, `att:m:${matricNo}`, 10, 600));
    if (!allowed) {
      return { success: false, error: TOO_MANY_ATTEMPTS };
    }

    // 1. Validate student and class code together. One generic refusal for unknown
    // student / wrong code / closed class, so matric numbers cannot be harvested.
    const { data: student, error: stuErr } = await supabase
      .from('ces_students')
      .select('id, matric_no, surname, first_name, cohort_type, status, semester_id')
      .eq('matric_no', matricNo)
      .eq('is_deleted', false)
      .maybeSingle();

    if (stuErr || !student) {
      return { success: false, error: CHECKIN_REFUSED };
    }

    const { data: codeRow } = await supabase
      .from('ces_class_codes')
      .select('code, is_open')
      .eq('semester_id', student.semester_id)
      .eq('course_name', courseName)
      .maybeSingle();

    if (!codeRow || !codeRow.is_open || !codesMatch(codeRow.code, classCode)) {
      return { success: false, error: CHECKIN_REFUSED };
    }

    if (student.status !== 'Active') {
      return {
        success: false,
        error: `Student status is ${student.status}. Only active students may check in for classes.`,
      };
    }

    // 2. Strictly check for existing attendance record for this student and course in this semester
    const { data: existingRecord } = await supabase
      .from('ces_attendance_records')
      .select('id, session_date, logged_at')
      .eq('student_id', student.id)
      .eq('semester_id', student.semester_id)
      .eq('course_name', courseName)
      .maybeSingle();

    if (existingRecord) {
      const formattedDate = existingRecord.session_date
        ? new Date(existingRecord.session_date + 'T00:00:00').toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : 'an earlier date';

      return {
        success: false,
        error: `Attendance for "${courseName}" has already been recorded for ${student.matric_no} (${student.first_name} ${student.surname}) on ${formattedDate}. Duplicate attendance check-ins are not permitted.`,
      };
    }

    // 3. Insert new attendance record
    const { error: insErr } = await supabase
      .from('ces_attendance_records')
      .insert({
        student_id: student.id,
        semester_id: student.semester_id,
        course_name: courseName,
        status: 'Attended',
        delivery_rating: deliveryRating,
        delivery_feedback: deliveryFeedback,
        session_date: finalDate,
        logged_at: new Date().toISOString(),
      });

    if (insErr) {
      if (insErr.code === '23505' || insErr.message.includes('unique') || insErr.message.includes('duplicate')) {
        return {
          success: false,
          error: `Attendance for "${courseName}" has already been recorded for matric number "${student.matric_no}". Duplicate attendance check-ins are not permitted.`,
        };
      }
      return failWith('attendance', insErr, 'Failed to record attendance. Please try again.');
    }

    const fullName = `${student.first_name} ${student.surname}`;

    return {
      success: true,
      studentName: fullName,
      matricNo: student.matric_no,
      cohortType: student.cohort_type,
      courseName,
      sessionDate: finalDate,
      rating: deliveryRating,
    };
  } catch (err: unknown) {
    return failWith('attendance', err, 'Check-in could not be completed. Please try again.');
  }
}

/**
 * Teacher / Admin Action:
 * Fetches aggregated teaching delivery feedback and ratings for a course or all courses.
 */
export async function getAttendanceFeedbackAction(
  courseName?: string
): Promise<{ success: boolean; stats?: AttendanceSummaryStats; error?: string }> {
  try {
    await requireStaffUser();
    const supabase = createAdminClient();

    let query = supabase
      .from('ces_attendance_records')
      .select('id, course_name, delivery_rating, delivery_feedback, session_date, logged_at, student:ces_students(first_name, surname, matric_no)')
      .order('logged_at', { ascending: false })
      .limit(100);

    if (courseName && courseName !== 'all') {
      query = query.eq('course_name', courseName);
    }

    const { data: records, error } = await query;

    if (error) {
      return failWith('attendance', error, 'Something went wrong. Please try again.');
    }

    const feedbacks: AttendanceFeedbackItem[] = (records || []).map((r) => {
      // Supabase relationship cast
      const stu = r.student as unknown as { first_name?: string; surname?: string; matric_no?: string } | null;
      const sName = stu ? `${stu.first_name || ''} ${stu.surname || ''}`.trim() : 'Anonymous Student';
      const mNo = stu?.matric_no || 'N/A';

      return {
        id: r.id,
        courseName: r.course_name,
        studentName: sName,
        matricNo: mNo,
        deliveryRating: r.delivery_rating,
        deliveryFeedback: r.delivery_feedback,
        sessionDate: r.session_date,
        loggedAt: r.logged_at,
      };
    });

    // The feedback list shows only the latest 100 comments, but the totals and the average
    // must cover EVERY check-in, so read all ratings (paged: 1,000-row response cap).
    const { data: allRatings, error: ratingsErr } = await fetchAll((from, to) => {
      let q = supabase
        .from('ces_attendance_records')
        .select('delivery_rating')
        .order('id', { ascending: true })
        .range(from, to);
      if (courseName && courseName !== 'all') q = q.eq('course_name', courseName);
      return q;
    });
    if (ratingsErr) {
      return failWith('attendance', ratingsErr, 'Something went wrong. Please try again.');
    }

    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRatingsSum = 0;
    let validRatingsCount = 0;

    for (const r of allRatings) {
      const rating = r.delivery_rating;
      if (rating && rating >= 1 && rating <= 5) {
        ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
        totalRatingsSum += rating;
        validRatingsCount++;
      }
    }

    const averageRating = validRatingsCount > 0 ? Number((totalRatingsSum / validRatingsCount).toFixed(1)) : 0;

    return {
      success: true,
      stats: {
        totalCheckins: allRatings.length,
        averageRating,
        ratingCounts,
        feedbacks,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch attendance feedback';
    return { success: false, error: msg };
  }
}


export interface ClassCodeItem {
  id: string;
  courseName: string;
  code: string;
  isOpen: boolean;
}

/**
 * Staff Action: lists the class attendance codes for a cohort's active semester,
 * creating any that do not exist yet (closed, with a random code).
 */
export async function getClassCodesAction(
  cohortType: string = 'Regular'
): Promise<{ success: boolean; semesterName?: string; codes?: ClassCodeItem[]; error?: string }> {
  try {
    await requireStaffUser();
    const supabase = createAdminClient();

    const { data: semester } = await supabase
      .from('ces_semesters')
      .select('id, name')
      .eq('type', cohortType)
      .eq('is_active', true)
      .maybeSingle();
    if (!semester) {
      return { success: false, error: `No active semester found for "${cohortType}".` };
    }

    const { data: existing, error } = await supabase
      .from('ces_class_codes')
      .select('id, course_name, code, is_open')
      .eq('semester_id', semester.id);
    if (error) return failWith('attendance', error, 'Something went wrong. Please try again.');

    const have = new Set((existing || []).map((r) => r.course_name));
    const missing = ATTENDANCE_COURSE_NAMES.filter((n) => !have.has(n));
    let rows = existing || [];
    if (missing.length > 0) {
      const { data: inserted, error: insErr } = await supabase
        .from('ces_class_codes')
        .upsert(
          missing.map((name) => ({
            semester_id: semester.id,
            course_name: name,
            code: generateCode(),
            is_open: false,
          })),
          { onConflict: 'semester_id,course_name', ignoreDuplicates: true }
        )
        .select('id, course_name, code, is_open');
      if (insErr) return failWith('attendance', insErr, 'Something went wrong. Please try again.');
      rows = [...rows, ...(inserted || [])];
    }

    const order = new Map<string, number>(ATTENDANCE_COURSE_NAMES.map((n, i) => [n, i]));
    const codes = rows
      .map((r) => ({ id: r.id, courseName: r.course_name, code: r.code, isOpen: r.is_open }))
      .sort((x, y) => (order.get(x.courseName) ?? 99) - (order.get(y.courseName) ?? 99));
    return { success: true, semesterName: semester.name, codes };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to load class codes' };
  }
}

/** Staff Action: open or close check-in for one class. */
export async function setClassCodeOpenAction(
  id: string,
  isOpen: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireStaffUser();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('ces_class_codes')
      .update({ is_open: isOpen, updated_at: new Date().toISOString() })
      .eq('id', id);
    return error ? failWith('attendance', error, 'Something went wrong. Please try again.') : { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update class code' };
  }
}

/** Staff Action: replace a class's code with a new random one. */
export async function regenerateClassCodeAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireStaffUser();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('ces_class_codes')
      .update({ code: generateCode(), updated_at: new Date().toISOString() })
      .eq('id', id);
    return error ? failWith('attendance', error, 'Something went wrong. Please try again.') : { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to regenerate class code' };
  }
}
