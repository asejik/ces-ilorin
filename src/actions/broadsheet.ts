'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import {
  calculateCumulativeScore,
  determineGraduationStatus,
  determineHonourClass,
} from '@/lib/academic';
import { generateCertificateNumber, formatCertificateDate } from '@/lib/certificate';
import type { AttendanceStatus, HonourClass } from '@/types/database';
import type {
  BroadsheetResponse,
  StudentBroadsheetRow,
  BroadsheetKPIs,
  CertificateDetails,
} from '@/types/broadsheet';

const MODULAR_COURSES = [
  'salvation',
  'righteousness',
  'word_of_god',
  'love_walk',
  'service',
  'spiritual_authority',
  'holy_spirit',
  'prayer',
] as const;

/**
 * Staff Action: Fetches the full academic broadsheet roster including
 * continuous assessment scores, final exams, mandatory attendance clearance,
 * graduation status, honour classification, and certificate records.
 */
export async function getBroadsheetAction(
  cohortType: string = 'Regular'
): Promise<BroadsheetResponse> {
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

    const studentIds = (students || []).map((s) => s.id);

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
    const quizIds = (quizzes || []).map((q) => q.id);

    // 4. Fetch all assessment submissions for this semester
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

    // 6. Fetch existing certificates for enrolled students
    let certificatesData: Array<{
      id: string;
      student_id: string;
      certificate_no: string;
      issued_at: string;
      pdf_url: string | null;
    }> = [];

    if (studentIds.length > 0) {
      const { data: certs } = await supabase
        .from('ces_certificates')
        .select('id, student_id, certificate_no, issued_at, pdf_url')
        .in('student_id', studentIds);

      if (certs) {
        certificatesData = certs;
      }
    }

    const certificateMap = new Map((certificatesData || []).map((c) => [c.student_id, c]));

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

    // 7. Aggregate Broadsheet Rows
    let totalScoreSum = 0;
    let scoredStudentsCount = 0;
    let graduatesCount = 0;
    let pendingCount = 0;
    let notYetCount = 0;
    let distinctionCount = 0;
    let meritCount = 0;
    let passCount = 0;

    const rows: StudentBroadsheetRow[] = (students || []).map((stu) => {
      const stuScores = studentAssessmentsMap.get(stu.id);
      const stuAtt = studentAttendanceMap.get(stu.id);
      const cert = certificateMap.get(stu.id);

      // Modular Quizzes
      const quizzesObj: StudentBroadsheetRow['quizzes'] = {};
      let quizSum = 0;
      let allQuizzesComplete = true;

      for (const code of MODULAR_COURSES) {
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
      let finalExamObj: StudentBroadsheetRow['finalExam'] = null;
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

      // Cumulative Calculations
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

      // KPI Aggregations
      if (cumulativeTotal !== null) {
        totalScoreSum += cumulativeTotal;
        scoredStudentsCount++;
      }

      if (graduationStatus === '✅ GRADUATE') {
        graduatesCount++;
        if (honourClass === 'Distinction') distinctionCount++;
        else if (honourClass === 'Merit') meritCount++;
        else if (honourClass === 'Pass') passCount++;
      } else if (graduationStatus === '⏳ PENDING') {
        pendingCount++;
      } else {
        notYetCount++;
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
        certificateId: cert?.id ?? null,
        certificateNo: cert?.certificate_no ?? null,
        certificateIssuedAt: cert?.issued_at ?? null,
        certificatePdfUrl: cert?.pdf_url ?? null,
      };
    });

    const averageScore =
      scoredStudentsCount > 0 ? Number((totalScoreSum / scoredStudentsCount).toFixed(1)) : 0;

    const kpis: BroadsheetKPIs = {
      totalStudents: rows.length,
      graduatesCount,
      pendingCount,
      notYetCount,
      averageScore,
      distinctionCount,
      meritCount,
      passCount,
    };

    return {
      success: true,
      semester: {
        id: semester.id,
        name: semester.name,
        type: semester.type,
      },
      rows,
      kpis,
    };
  } catch (err: unknown) {
    console.error('[Broadsheet Error]:', err);
    const msg = err instanceof Error ? err.message : 'Failed to retrieve broadsheet data';
    return { success: false, error: msg };
  }
}

/**
 * Staff Action: Issues an official graduation certificate to an eligible student.
 * Strictly verifies the student has met all graduation criteria (Status = ✅ GRADUATE).
 */
export async function issueCertificateAction(
  studentId: string
): Promise<{ success: boolean; certificate?: CertificateDetails; error?: string }> {
  try {
    if (!studentId) {
      return { success: false, error: 'Student ID is required' };
    }

    const supabase = createAdminClient();

    // 1. Fetch student details
    const { data: student, error: stuErr } = await supabase
      .from('ces_students')
      .select('id, matric_no, surname, first_name, passport_url, cohort_type, semester_id')
      .eq('id', studentId)
      .maybeSingle();

    if (stuErr || !student) {
      return { success: false, error: 'Student record not found' };
    }

    // 2. Fetch semester details
    const { data: semester } = await supabase
      .from('ces_semesters')
      .select('id, name, type')
      .eq('id', student.semester_id)
      .maybeSingle();

    // 3. Check if certificate is already issued
    const { data: existingCert } = await supabase
      .from('ces_certificates')
      .select('id, certificate_no, honour_class, cumulative_total, issued_at')
      .eq('student_id', student.id)
      .maybeSingle();

    if (existingCert) {
      return {
        success: true,
        certificate: {
          id: existingCert.id,
          certificateNo: existingCert.certificate_no,
          studentId: student.id,
          studentName: `${student.first_name} ${student.surname}`,
          matricNo: student.matric_no,
          passportUrl: student.passport_url,
          cohortName: semester?.name ?? `${student.cohort_type} — 2026`,
          cohortType: student.cohort_type,
          cumulativeTotal: Number(existingCert.cumulative_total),
          honourClass: existingCert.honour_class as HonourClass,
          issuedAt: existingCert.issued_at,
          formattedIssuedDate: formatCertificateDate(existingCert.issued_at),
        },
      };
    }

    // 4. Verify graduation clearance criteria
    const { data: quizzes } = await supabase
      .from('ces_quizzes')
      .select('id, course_code, assessment_type, max_score')
      .eq('semester_id', student.semester_id);

    const quizIds = (quizzes || []).map((q) => q.id);
    const finalExam = (quizzes || []).find((q) => q.assessment_type === 'final_exam');

    let assessments: Array<{ quiz_id: string; score: number }> = [];
    if (quizIds.length > 0) {
      const { data: assData } = await supabase
        .from('ces_student_assessments')
        .select('quiz_id, score')
        .eq('student_id', student.id)
        .in('quiz_id', quizIds);
      if (assData) assessments = assData;
    }

    const { data: attData } = await supabase
      .from('ces_attendance_records')
      .select('course_name, status')
      .eq('student_id', student.id)
      .eq('semester_id', student.semester_id);

    const quizMap = new Map((quizzes || []).map((q) => [q.course_code, q]));
    const assMap = new Map(assessments.map((a) => [a.quiz_id, Number(a.score)]));
    const attMap = new Map((attData || []).map((a) => [a.course_name, a.status as AttendanceStatus]));

    let quizSum = 0;
    let allQuizzesComplete = true;
    for (const code of MODULAR_COURSES) {
      const qDef = quizMap.get(code);
      if (qDef) {
        const sc = assMap.get(qDef.id);
        if (sc !== undefined) {
          quizSum += sc;
        } else {
          allQuizzesComplete = false;
        }
      }
    }

    let examScore: number | null = null;
    if (finalExam) {
      const sc = assMap.get(finalExam.id);
      if (sc !== undefined) examScore = sc;
    }

    const quizTotal = allQuizzesComplete ? Number(quizSum.toFixed(2)) : null;
    const cumulativeTotal = calculateCumulativeScore(quizTotal, examScore);

    const elemPrinc = attMap.get('Elementary Principles') ?? null;
    const memVision = attMap.get('Membership & Vision Class') ?? null;

    const graduationStatus = determineGraduationStatus({
      cumulativeTotal,
      elementaryPrinciples: elemPrinc,
      membershipVision: memVision,
      allQuizzesEntered: allQuizzesComplete,
      examEntered: examScore !== null,
    });

    if (graduationStatus !== '✅ GRADUATE') {
      return {
        success: false,
        error:
          'Student has not met all graduation requirements (Score ≥ 50/100 and confirmed attendance in both mandatory classes).',
      };
    }

    const finalTotal = cumulativeTotal ?? 0;
    const honourClass = determineHonourClass(finalTotal) ?? 'Pass';
    const certificateNo = generateCertificateNumber(student.matric_no);

    // 5. Insert new certificate
    const { data: newCert, error: insErr } = await supabase
      .from('ces_certificates')
      .insert({
        student_id: student.id,
        certificate_no: certificateNo,
        honour_class: honourClass,
        cumulative_total: finalTotal,
      })
      .select('id, certificate_no, honour_class, cumulative_total, issued_at')
      .single();

    if (insErr || !newCert) {
      return { success: false, error: `Failed to issue certificate: ${insErr?.message}` };
    }

    return {
      success: true,
      certificate: {
        id: newCert.id,
        certificateNo: newCert.certificate_no,
        studentId: student.id,
        studentName: `${student.first_name} ${student.surname}`,
        matricNo: student.matric_no,
        passportUrl: student.passport_url,
        cohortName: semester?.name ?? `${student.cohort_type} — 2026`,
        cohortType: student.cohort_type,
        cumulativeTotal: Number(newCert.cumulative_total),
        honourClass: newCert.honour_class as HonourClass,
        issuedAt: newCert.issued_at,
        formattedIssuedDate: formatCertificateDate(newCert.issued_at),
      },
    };
  } catch (err: unknown) {
    console.error('[Issue Certificate Error]:', err);
    const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: msg };
  }
}

/**
 * Staff Action: Batch issues certificates for all qualified graduates in a cohort.
 */
export async function batchIssueCertificatesAction(
  cohortType: string = 'Regular'
): Promise<{ success: boolean; issuedCount?: number; totalGraduates?: number; error?: string }> {
  try {
    const broadsheetRes = await getBroadsheetAction(cohortType);
    if (!broadsheetRes.success || !broadsheetRes.rows) {
      return { success: false, error: broadsheetRes.error || 'Failed to inspect broadsheet' };
    }

    const eligibleGraduates = broadsheetRes.rows.filter(
      (r) => r.graduationStatus === '✅ GRADUATE' && !r.certificateId
    );

    let newlyIssued = 0;
    for (const student of eligibleGraduates) {
      const issueRes = await issueCertificateAction(student.studentId);
      if (issueRes.success) {
        newlyIssued++;
      }
    }

    return {
      success: true,
      issuedCount: newlyIssued,
      totalGraduates: broadsheetRes.kpis?.graduatesCount ?? 0,
    };
  } catch (err: unknown) {
    console.error('[Batch Issue Certificates Error]:', err);
    const msg = err instanceof Error ? err.message : 'Failed to batch issue certificates';
    return { success: false, error: msg };
  }
}

/**
 * Public & Admin Action: Fetches certificate details by Matriculation Number or Certificate Number
 * for instant printing, student self-service download, or verification.
 */
export async function getCertificateByMatricAction(
  identifier: string
): Promise<{ success: boolean; certificate?: CertificateDetails; error?: string }> {
  try {
    const supabase = createAdminClient();
    const cleanId = decodeURIComponent(identifier).trim().toUpperCase();

    // 1. Try finding student by matriculation number
    const { data: student } = await supabase
      .from('ces_students')
      .select('id, matric_no, surname, first_name, passport_url, cohort_type, semester_id')
      .ilike('matric_no', cleanId)
      .maybeSingle();

    let certQuery = supabase.from('ces_certificates').select('id, student_id, certificate_no, honour_class, cumulative_total, issued_at');

    if (student) {
      certQuery = certQuery.eq('student_id', student.id);
    } else {
      certQuery = certQuery.ilike('certificate_no', cleanId);
    }

    const { data: cert, error: certErr } = await certQuery.maybeSingle();

    if (certErr || !cert) {
      // If student exists but certificate is not yet issued, check if student is a cleared graduate and issue it
      if (student) {
        const issueRes = await issueCertificateAction(student.id);
        if (issueRes.success && issueRes.certificate) {
          return { success: true, certificate: issueRes.certificate };
        }
      }
      return { success: false, error: 'No graduation certificate found for this identifier' };
    }

    // Resolve student if we queried by cert_no
    let resolvedStudent = student;
    if (!resolvedStudent) {
      const { data: s } = await supabase
        .from('ces_students')
        .select('id, matric_no, surname, first_name, passport_url, cohort_type, semester_id')
        .eq('id', cert.student_id)
        .maybeSingle();
      resolvedStudent = s;
    }

    if (!resolvedStudent) {
      return { success: false, error: 'Student record associated with this certificate not found' };
    }

    const { data: semester } = await supabase
      .from('ces_semesters')
      .select('name')
      .eq('id', resolvedStudent.semester_id)
      .maybeSingle();

    return {
      success: true,
      certificate: {
        id: cert.id,
        certificateNo: cert.certificate_no,
        studentId: resolvedStudent.id,
        studentName: `${resolvedStudent.first_name} ${resolvedStudent.surname}`,
        matricNo: resolvedStudent.matric_no,
        passportUrl: resolvedStudent.passport_url,
        cohortName: semester?.name ?? `${resolvedStudent.cohort_type} — 2026`,
        cohortType: resolvedStudent.cohort_type,
        cumulativeTotal: Number(cert.cumulative_total),
        honourClass: cert.honour_class as HonourClass,
        issuedAt: cert.issued_at,
        formattedIssuedDate: formatCertificateDate(cert.issued_at),
      },
    };
  } catch (err: unknown) {
    console.error('[Get Certificate Error]:', err);
    const msg = err instanceof Error ? err.message : 'Failed to retrieve certificate';
    return { success: false, error: msg };
  }
}
