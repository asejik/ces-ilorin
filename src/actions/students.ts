'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { failWith } from '@/lib/errors';
import { ADMIN_ROLES, requireStaffUser, type StaffUser } from '@/lib/auth/guard';
import { AUDIT_FAILED_MESSAGE, writeAuditLog } from '@/lib/audit';
import { sanitizeSearchTerm } from '@/lib/search-term';
import { signPassportPaths } from '@/lib/passport-photos';
import { withinRateLimit } from '@/lib/rate-limit';
import { sendWelcomeEmail } from '@/lib/email';
import {
  calculateCumulativeScore,
  determineGraduationStatus,
  determineHonourClass,
} from '@/lib/academic';
import type { AttendanceStatus } from '@/types/database';

export interface StudentSearchHit {
  id: string;
  matricNo: string;
  fullName: string;
  cohortType: string;
  semesterName: string;
  status: string;
}

export interface Student360 {
  profile: {
    id: string;
    matricNo: string;
    fullName: string;
    cohortType: string;
    semesterName: string;
    status: string;
    registeredAt: string;
    consentAt: string | null;
    consentVersion: string | null;
    emailStatus: string;
    emailSentAt: string | null;
    photoUrl: string | null;
    /** Contact and personal details are for administrators only. */
    contact: {
      email: string;
      phone: string;
      whatsapp: string | null;
      address: string | null;
      emergencyContact: string | null;
      emergencyPhone: string | null;
      notes: string | null;
    } | null;
  };
  scores: Array<{
    courseCode: string;
    title: string;
    kind: 'quiz' | 'final_exam';
    score: number | null;
    maxScore: number;
    isOverride: boolean;
    overrideReason: string | null;
    submittedAt: string | null;
  }>;
  attendance: Array<{ courseName: string; status: string; sessionDate: string }>;
  summary: {
    quizTotal: number | null;
    cumulativeTotal: number | null;
    graduationStatus: string;
    honourClass: string | null;
  };
  certificate: { certificateNo: string; issuedAt: string; honourClass: string } | null;
  history: Array<{
    at: string;
    action: string;
    actorEmail: string | null;
    reason: string | null;
    oldValue: Record<string, unknown> | null;
    newValue: Record<string, unknown> | null;
  }>;
  canManage: boolean;
}

interface Result {
  success: boolean;
  error?: string;
}

const MODULAR_ORDER = [
  'salvation',
  'righteousness',
  'word_of_god',
  'love_walk',
  'service',
  'spiritual_authority',
  'holy_spirit',
  'prayer',
];

async function staffOrNull(): Promise<StaffUser | null> {
  try {
    return await requireStaffUser();
  } catch {
    return null;
  }
}

/** Any staff member: find students by matric number or name (administrators also by e-mail). */
export async function searchStudentsAction(
  query: string
): Promise<Result & { students?: StudentSearchHit[] }> {
  try {
    const staff = await staffOrNull();
    if (!staff) return { success: false, error: 'Staff sign-in required.' };
    const term = sanitizeSearchTerm(query);
    if (!term) return { success: false, error: 'Type at least 2 characters.' };

    const supabase = createAdminClient();
    const filters = [`matric_no.ilike.%${term}%`, `surname.ilike.%${term}%`, `first_name.ilike.%${term}%`];
    if (ADMIN_ROLES.includes(staff.role as (typeof ADMIN_ROLES)[number])) {
      filters.push(`email_address.ilike.%${term}%`);
    }

    const { data, error } = await supabase
      .from('ces_students')
      .select('id, matric_no, surname, first_name, cohort_type, status, ces_semesters(name)')
      .eq('is_deleted', false)
      .or(filters.join(','))
      .order('matric_no', { ascending: true })
      .limit(25);
    if (error) return failWith('students', error, 'Search failed. Please try again.');

    return {
      success: true,
      students: (data ?? []).map((s) => {
        const sem = s.ces_semesters as { name: string } | { name: string }[] | null;
        return {
          id: s.id,
          matricNo: s.matric_no,
          fullName: `${s.first_name} ${s.surname}`,
          cohortType: s.cohort_type,
          semesterName: (Array.isArray(sem) ? sem[0]?.name : sem?.name) ?? '',
          status: s.status,
        };
      }),
    };
  } catch (err: unknown) {
    return failWith('students', err, 'Search failed. Please try again.');
  }
}

/** Any staff member: one student's whole record. Contact details only for administrators. */
export async function getStudent360Action(
  studentId: string
): Promise<Result & { student?: Student360 }> {
  try {
    const staff = await staffOrNull();
    if (!staff) return { success: false, error: 'Staff sign-in required.' };
    const canManage = ADMIN_ROLES.includes(staff.role as (typeof ADMIN_ROLES)[number]);
    const supabase = createAdminClient();

    const { data: s } = await supabase
      .from('ces_students')
      .select('*, ces_semesters(name)')
      .eq('id', studentId)
      .eq('is_deleted', false)
      .maybeSingle();
    if (!s) return { success: false, error: 'Student not found.' };

    const [quizzesRes, assessRes, attRes, certRes, auditRes] = await Promise.all([
      supabase
        .from('ces_quizzes')
        .select('id, course_code, title, assessment_type, max_score')
        .eq('semester_id', s.semester_id),
      supabase
        .from('ces_student_assessments')
        .select('quiz_id, score, is_manual_override, override_reason, submitted_at')
        .eq('student_id', s.id),
      supabase
        .from('ces_attendance_records')
        .select('course_name, status, session_date')
        .eq('student_id', s.id)
        .eq('semester_id', s.semester_id)
        .order('session_date', { ascending: true }),
      supabase
        .from('ces_certificates')
        .select('certificate_no, issued_at, honour_class')
        .eq('student_id', s.id)
        .maybeSingle(),
      supabase
        .from('ces_audit_log')
        .select('created_at, action, actor_email, reason, old_value, new_value')
        .eq('student_id', s.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);
    for (const r of [quizzesRes, assessRes, attRes, certRes, auditRes]) {
      if (r.error) return failWith('students', r.error, 'Could not load this student. Please try again.');
    }

    const quizzes = quizzesRes.data ?? [];
    const byQuiz = new Map((assessRes.data ?? []).map((a) => [a.quiz_id, a]));
    const orderOf = (code: string) => {
      const i = MODULAR_ORDER.indexOf(code);
      return i === -1 ? 99 : i;
    };
    const scores: Student360['scores'] = [...quizzes]
      .sort((a, b) => orderOf(a.course_code) - orderOf(b.course_code))
      .map((q) => {
        const a = byQuiz.get(q.id);
        return {
          courseCode: q.course_code,
          title: q.title,
          kind: q.assessment_type as 'quiz' | 'final_exam',
          score: a ? Number(a.score) : null,
          maxScore: Number(q.max_score),
          isOverride: a?.is_manual_override ?? false,
          overrideReason: a?.override_reason ?? null,
          submittedAt: a?.submitted_at ?? null,
        };
      });

    const modular = scores.filter((x) => x.kind === 'quiz');
    const exam = scores.find((x) => x.kind === 'final_exam');
    const allQuizzes = modular.length > 0 && modular.every((x) => x.score !== null);
    const quizTotal = allQuizzes ? Number(modular.reduce((t, x) => t + (x.score ?? 0), 0).toFixed(2)) : null;
    const examScore = exam?.score ?? null;
    const cumulativeTotal = calculateCumulativeScore(quizTotal, examScore);
    const att = new Map((attRes.data ?? []).map((a) => [a.course_name, a.status as AttendanceStatus]));
    const graduationStatus = determineGraduationStatus({
      cumulativeTotal,
      elementaryPrinciples: att.get('Elementary Principles') ?? null,
      membershipVision: att.get('Membership & Vision Class') ?? null,
      allQuizzesEntered: allQuizzes,
      examEntered: examScore !== null,
    });

    const photos = await signPassportPaths(supabase, [s.passport_url]);
    const sem = s.ces_semesters as { name: string } | { name: string }[] | null;

    return {
      success: true,
      student: {
        profile: {
          id: s.id,
          matricNo: s.matric_no,
          fullName: [s.first_name, s.middle_name, s.surname].filter(Boolean).join(' '),
          cohortType: s.cohort_type,
          semesterName: (Array.isArray(sem) ? sem[0]?.name : sem?.name) ?? '',
          status: s.status,
          registeredAt: s.created_at,
          consentAt: s.consent_at ?? null,
          consentVersion: s.consent_version ?? null,
          emailStatus: s.email_status ?? 'unknown',
          emailSentAt: s.email_sent_at ?? null,
          photoUrl: s.passport_url ? photos.get(s.passport_url) ?? null : null,
          contact: canManage
            ? {
                email: s.email_address,
                phone: s.phone_number,
                whatsapp: s.whatsapp_number,
                address: s.permanent_address,
                emergencyContact: s.emergency_contact,
                emergencyPhone: s.emergency_contact_phone,
                notes: s.notes,
              }
            : null,
        },
        scores,
        // Written delivery feedback stays anonymous: only status and date are shown per student.
        attendance: (attRes.data ?? []).map((a) => ({
          courseName: a.course_name,
          status: a.status,
          sessionDate: a.session_date,
        })),
        summary: {
          quizTotal,
          cumulativeTotal,
          graduationStatus,
          honourClass: determineHonourClass(cumulativeTotal),
        },
        certificate: certRes.data
          ? {
              certificateNo: certRes.data.certificate_no,
              issuedAt: certRes.data.issued_at,
              honourClass: certRes.data.honour_class,
            }
          : null,
        history: (auditRes.data ?? []).map((h) => ({
          at: h.created_at,
          action: h.action,
          actorEmail: h.actor_email,
          reason: h.reason,
          oldValue: h.old_value,
          newValue: h.new_value,
        })),
        canManage,
      },
    };
  } catch (err: unknown) {
    return failWith('students', err, 'Could not load this student. Please try again.');
  }
}

/** Admin: send the welcome e-mail (matric number + manual) again and record the outcome. */
export async function resendWelcomeEmailAction(
  studentId: string
): Promise<Result & { emailStatus?: string }> {
  try {
    let staff: StaffUser;
    try {
      staff = await requireStaffUser(ADMIN_ROLES);
    } catch {
      return { success: false, error: 'You are not allowed to resend emails.' };
    }
    const supabase = createAdminClient();

    const { data: s } = await supabase
      .from('ces_students')
      .select('id, matric_no, first_name, surname, email_address, cohort_type')
      .eq('id', studentId)
      .eq('is_deleted', false)
      .maybeSingle();
    if (!s) return { success: false, error: 'Student not found.' };

    if (!(await withinRateLimit(supabase, `resend:${s.id}`, 3, 3600))) {
      return { success: false, error: 'This email was already resent 3 times in the last hour. Try again later.' };
    }

    const result = await sendWelcomeEmail({
      to: s.email_address,
      studentName: `${s.first_name} ${s.surname}`,
      matricNo: s.matric_no,
      cohortType: s.cohort_type,
    });

    const { error: upErr } = await supabase
      .from('ces_students')
      .update({
        email_status: result.status,
        email_sent_at: result.status === 'sent' ? new Date().toISOString() : null,
      })
      .eq('id', s.id);
    if (upErr) console.error('[students] could not record email status:', upErr.message);

    const logged = await writeAuditLog(supabase, staff, {
      action: 'welcome_email_resent',
      studentId: s.id,
      targetTable: 'ces_students',
      targetId: s.id,
      oldValue: null,
      newValue: { email_status: result.status },
    });

    if (result.status === 'failed') {
      return { success: false, emailStatus: result.status, error: 'The email could not be sent. Check the mail settings and try again.' };
    }
    if (!logged) return { success: true, emailStatus: result.status, error: AUDIT_FAILED_MESSAGE };
    return { success: true, emailStatus: result.status };
  } catch (err: unknown) {
    return failWith('students', err, 'Could not resend the email. Please try again.');
  }
}
