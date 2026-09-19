'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import {
  attendanceCheckinSchema,
  type AttendanceCheckinInput,
} from '@/lib/validation/attendance';

export interface AttendanceCheckinResult {
  success: boolean;
  error?: string;
  studentName?: string;
  matricNo?: string;
  courseName?: string;
  rating?: number;
  isUpdate?: boolean;
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

    const { matricNo, courseName, deliveryRating, deliveryFeedback } = parseResult.data;
    const supabase = createAdminClient();

    // 1. Validate student
    const { data: student, error: stuErr } = await supabase
      .from('ces_students')
      .select('id, matric_no, surname, first_name, cohort_type, status, semester_id')
      .eq('matric_no', matricNo)
      .eq('is_deleted', false)
      .maybeSingle();

    if (stuErr || !student) {
      return {
        success: false,
        error: `No registered student found with matric number "${matricNo}". Please check your number.`,
      };
    }

    if (student.status !== 'Active') {
      return {
        success: false,
        error: `Student status is ${student.status}. Only active students may check in for classes.`,
      };
    }

    // 2. Check for existing attendance record for this student and course in this semester
    const { data: existingRecord } = await supabase
      .from('ces_attendance_records')
      .select('id')
      .eq('student_id', student.id)
      .eq('semester_id', student.semester_id)
      .eq('course_name', courseName)
      .maybeSingle();

    let isUpdate = false;

    if (existingRecord) {
      // Update existing record with refreshed rating, feedback, and timestamp
      const { error: updateErr } = await supabase
        .from('ces_attendance_records')
        .update({
          status: 'Attended',
          delivery_rating: deliveryRating,
          delivery_feedback: deliveryFeedback,
          session_date: new Date().toISOString().split('T')[0],
          logged_at: new Date().toISOString(),
        })
        .eq('id', existingRecord.id);

      if (updateErr) {
        return { success: false, error: `Failed to update attendance: ${updateErr.message}` };
      }
      isUpdate = true;
    } else {
      // Insert new attendance record
      const { error: insErr } = await supabase
        .from('ces_attendance_records')
        .insert({
          student_id: student.id,
          semester_id: student.semester_id,
          course_name: courseName,
          status: 'Attended',
          delivery_rating: deliveryRating,
          delivery_feedback: deliveryFeedback,
          session_date: new Date().toISOString().split('T')[0],
        });

      if (insErr) {
        return { success: false, error: `Failed to record attendance: ${insErr.message}` };
      }
    }

    const fullName = `${student.first_name} ${student.surname}`;

    return {
      success: true,
      studentName: fullName,
      matricNo: student.matric_no,
      courseName,
      rating: deliveryRating,
      isUpdate,
    };
  } catch (err: unknown) {
    console.error('[Attendance Checkin Error]:', err);
    const msg = err instanceof Error ? err.message : 'An unexpected error occurred during check-in';
    return { success: false, error: msg };
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
    const supabase = createAdminClient();

    let query = supabase
      .from('ces_attendance_records')
      .select('id, course_name, delivery_rating, delivery_feedback, session_date, logged_at, student:ces_students(first_name, surname, matric_no)')
      .order('logged_at', { ascending: false });

    if (courseName && courseName !== 'all') {
      query = query.eq('course_name', courseName);
    }

    const { data: records, error } = await query;

    if (error) {
      return { success: false, error: error.message };
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

    // Compute ratings summary
    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRatingsSum = 0;
    let validRatingsCount = 0;

    for (const f of feedbacks) {
      if (f.deliveryRating && f.deliveryRating >= 1 && f.deliveryRating <= 5) {
        ratingCounts[f.deliveryRating] = (ratingCounts[f.deliveryRating] || 0) + 1;
        totalRatingsSum += f.deliveryRating;
        validRatingsCount++;
      }
    }

    const averageRating = validRatingsCount > 0 ? Number((totalRatingsSum / validRatingsCount).toFixed(1)) : 0;

    return {
      success: true,
      stats: {
        totalCheckins: feedbacks.length,
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
