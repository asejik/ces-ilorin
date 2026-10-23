'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { failWith } from '@/lib/errors';
import { requireStaffUser } from '@/lib/auth/guard';
import {
  assessmentAccessSchema,
  assessmentSubmissionSchema,
  quizSessionUpdateSchema,
  type AssessmentAccessInput,
  type AssessmentSubmissionInput,
  type QuizSessionUpdateInput,
} from '@/lib/validation/assessment';
import { CES_CURRICULUM } from '@/lib/curriculum';
import { codesMatch, generateCode } from '@/lib/codes';
import { getClientIp, TOO_MANY_ATTEMPTS, withinRateLimit } from '@/lib/rate-limit';

const ACCESS_REFUSED =
  'Matric number or session PIN is incorrect. Please check both, or ask your instructor for the active PIN.';

export interface SanitizedQuestion {
  id: string;
  questionText: string;
  options: string[];
  marks: number;
  sortOrder: number;
}

export interface VerifyAccessResult {
  success: boolean;
  error?: string;
  alreadyTaken?: boolean;
  existingScore?: number;
  submittedAt?: string;
  student?: {
    id: string;
    matricNo: string;
    fullName: string;
    cohortType: string;
  };
  quiz?: {
    id: string;
    courseCode: string;
    title: string;
    assessmentType: 'quiz' | 'final_exam';
    maxScore: number;
    questionCount: number;
  };
  questions?: SanitizedQuestion[];
}

export interface SubmitAssessmentResult {
  success: boolean;
  error?: string;
  score?: number;
  maxScore?: number;
  percentage?: number;
  courseTitle?: string;
  studentName?: string;
  matricNo?: string;
}

// In-memory cache of verified seeded semesters to eliminate redundant queries per request
const SEEDED_SEMESTERS_CACHE = new Set<string>();

/**
 * Ensures a quiz row exists for every course in the catalogue for the semester.
 * New rows start CLOSED with a random PIN. Questions and answer keys are managed
 * in the database only (never in source control), so none are seeded here.
 */
export async function ensureQuizzesSeeded(semesterId: string): Promise<void> {
  if (SEEDED_SEMESTERS_CACHE.has(semesterId)) {
    return;
  }

  const supabase = createAdminClient();

  const { data: existingQuizzes, error: qErr } = await supabase
    .from('ces_quizzes')
    .select('course_code')
    .eq('semester_id', semesterId);

  if (qErr) {
    console.error('[Seeder] Error querying ces_quizzes:', qErr);
    return;
  }

  const existingCodes = new Set((existingQuizzes || []).map((q) => q.course_code));
  const missing = CES_CURRICULUM.filter((c) => !existingCodes.has(c.code));

  if (missing.length > 0) {
    const { error: insertErr } = await supabase.from('ces_quizzes').insert(
      missing.map((course) => ({
        semester_id: semesterId,
        course_code: course.code,
        title: course.title,
        assessment_type: course.type,
        max_score: course.maxScore,
        session_pin: generateCode(),
        is_open: false,
      }))
    );

    if (insertErr) {
      console.error('[Seeder] Failed to insert quizzes:', insertErr);
      return;
    }
  }

  SEEDED_SEMESTERS_CACHE.add(semesterId);
}

/**
 * Public action: Fetches all available courses and their live open/closed status
 */
export async function getAvailableQuizzesAction(cohortType: string = 'Regular') {
  try {
    const supabase = createAdminClient();

    // 1. Resolve active semester for this cohort
    const { data: semester } = await supabase
      .from('ces_semesters')
      .select('id, name, type')
      .eq('type', cohortType)
      .eq('is_active', true)
      .maybeSingle();

    if (!semester) {
      return { success: false, error: `No active semester found for cohort: ${cohortType}` };
    }

    // Ensure seeded
    await ensureQuizzesSeeded(semester.id);

    // 2. Fetch quizzes (without leaking session PINs)
    const { data: quizzes, error } = await supabase
      .from('ces_quizzes')
      .select('id, course_code, title, assessment_type, max_score, is_open')
      .eq('semester_id', semester.id)
      .order('created_at', { ascending: true });

    if (error) {
      return failWith('assessment', error, 'Something went wrong. Please try again.');
    }

    return {
      success: true,
      cohortType: semester.type,
      semesterName: semester.name,
      quizzes: quizzes || [],
    };
  } catch (err: unknown) {
    return failWith('assessment', err, 'Could not load the assessment list. Please try again.');
  }
}

/**
 * Candidate verification action:
 * Validates Matriculation Number + Session PIN and returns sanitized questions
 * WITHOUT exposing correct_option_index to the client bundle.
 */
export async function verifyAssessmentAccessAction(
  input: AssessmentAccessInput
): Promise<VerifyAccessResult> {
  try {
    const parseResult = assessmentAccessSchema.safeParse(input);
    if (!parseResult.success) {
      const firstErr = parseResult.error.errors[0]?.message || 'Invalid access parameters';
      return { success: false, error: firstErr };
    }

    const { matricNo, courseCode, sessionPin, cohortType } = parseResult.data;
    const supabase = createAdminClient();

    // Round trips to the database dominate latency, so independent queries run together.
    // 0 + 1. Throttle guessing (per network address and per matric number) while looking up the
    // student. Per-address limits are generous on purpose: a whole class shares one wifi /
    // mobile-carrier address; the strict brute-force guard is the per-matric limit.
    const ip = await getClientIp();
    const [ipOk, matricOk, studentResult] = await Promise.all([
      withinRateLimit(supabase, `assess:ip:${ip}`, 300, 600),
      withinRateLimit(supabase, `assess:m:${matricNo}`, 12, 600),
      supabase
        .from('ces_students')
        .select('id, matric_no, surname, first_name, cohort_type, status, semester_id')
        .eq('matric_no', matricNo)
        .eq('is_deleted', false)
        .maybeSingle(),
    ]);
    if (!ipOk || !matricOk) {
      return { success: false, error: TOO_MANY_ATTEMPTS };
    }

    // Find the quiz, then check matric + PIN together. Unknown matric and wrong PIN give the
    // same message, so matric numbers cannot be harvested.
    const { data: student, error: studentErr } = studentResult;

    if (studentErr || !student) {
      return { success: false, error: ACCESS_REFUSED };
    }

    const loadQuiz = () =>
      supabase
        .from('ces_quizzes')
        .select('id, course_code, title, assessment_type, max_score, session_pin, is_open')
        .eq('semester_id', student.semester_id)
        .eq('course_code', courseCode)
        .maybeSingle();

    let { data: quiz, error: quizErr } = await loadQuiz();
    if (!quiz && !quizErr) {
      // First visit of a new semester: create its quiz rows (closed), then look again.
      await ensureQuizzesSeeded(student.semester_id);
      ({ data: quiz, error: quizErr } = await loadQuiz());
    }

    if (quizErr || !quiz || !codesMatch(quiz.session_pin, sessionPin)) {
      return { success: false, error: ACCESS_REFUSED };
    }

    // Credentials are valid from here on, so specific messages no longer leak anything.
    if (student.status !== 'Active') {
      return {
        success: false,
        error: `Student status is ${student.status}. Only active students may take assessments.`,
      };
    }

    if (cohortType && student.cohort_type !== cohortType) {
      return {
        success: false,
        error: `Matric number "${matricNo}" is registered under the "${student.cohort_type}", but "${cohortType}" is currently selected. Please switch to the ${student.cohort_type} tab above to enter your room.`,
      };
    }

    if (!quiz.is_open) {
      return {
        success: false,
        error: `The assessment session for "${quiz.title}" is currently closed. Please ask your instructor to open the session.`,
      };
    }

    // 6 + 7. Check for a duplicate submission and fetch the questions at the same time
    const [existingResult, questionsResult] = await Promise.all([
      supabase
        .from('ces_student_assessments')
        .select('id, score, submitted_at')
        .eq('student_id', student.id)
        .eq('quiz_id', quiz.id)
        .maybeSingle(),
      supabase
        .from('ces_quiz_questions')
        .select('id, question_text, options, marks, sort_order')
        .eq('quiz_id', quiz.id)
        .order('sort_order', { ascending: true }),
    ]);
    const existingSubmission = existingResult.data;

    if (existingSubmission) {
      return {
        success: false,
        alreadyTaken: true,
        existingScore: Number(existingSubmission.score),
        submittedAt: existingSubmission.submitted_at,
        error: `You have already completed this assessment on ${new Date(
          existingSubmission.submitted_at
        ).toLocaleDateString()}. Your recorded score is ${existingSubmission.score} / ${quiz.max_score}.`,
      };
    }

    // Strip answer keys (never selected above) and shape the questions for the browser
    const { data: questions, error: questErr } = questionsResult;

    if (questErr || !questions || questions.length === 0) {
      return {
        success: false,
        error: `No questions have been configured for "${quiz.title}". Please notify administration.`,
      };
    }

    // Sanitize questions
    const sanitizedQuestions: SanitizedQuestion[] = questions.map((q) => ({
      id: q.id,
      questionText: q.question_text,
      options: (q.options as string[]) || [],
      marks: Number(q.marks),
      sortOrder: q.sort_order,
    }));

    return {
      success: true,
      student: {
        id: student.id,
        matricNo: student.matric_no,
        fullName: `${student.first_name} ${student.surname}`,
        cohortType: student.cohort_type,
      },
      quiz: {
        id: quiz.id,
        courseCode: quiz.course_code,
        title: quiz.title,
        assessmentType: quiz.assessment_type,
        maxScore: Number(quiz.max_score),
        questionCount: sanitizedQuestions.length,
      },
      questions: sanitizedQuestions,
    };
  } catch (err: unknown) {
    return failWith('assessment', err, 'Could not verify access. Please try again.');
  }
}

/**
 * Server-side assessment scoring action:
 * Evaluates candidate responses strictly against server-held answer keys,
 * computes score, and writes record to ces_student_assessments atomically.
 */
export async function submitAssessmentAction(
  input: AssessmentSubmissionInput
): Promise<SubmitAssessmentResult> {
  try {
    const parseResult = assessmentSubmissionSchema.safeParse(input);
    if (!parseResult.success) {
      const firstErr = parseResult.error.errors[0]?.message || 'Invalid submission format';
      return { success: false, error: firstErr };
    }

    const { matricNo, quizId, answers, sessionPin } = parseResult.data;
    const supabase = createAdminClient();

    // Independent lookups run together (database round trips dominate latency)
    const [rateOk, studentResult, quizResult] = await Promise.all([
      withinRateLimit(supabase, `submit:ip:${await getClientIp()}`, 300, 600),
      supabase
        .from('ces_students')
        .select('id, surname, first_name, matric_no, semester_id')
        .eq('matric_no', matricNo)
        .eq('is_deleted', false)
        .maybeSingle(),
      supabase
        .from('ces_quizzes')
        .select('id, title, max_score, is_open, session_pin, semester_id')
        .eq('id', quizId)
        .maybeSingle(),
    ]);
    if (!rateOk) {
      return { success: false, error: TOO_MANY_ATTEMPTS };
    }

    // 1. Validate student
    const { data: student, error: stuErr } = studentResult;

    if (stuErr || !student) {
      return { success: false, error: 'Student record could not be verified.' };
    }

    // 2. Validate quiz
    const { data: quiz, error: qzErr } = quizResult;

    if (qzErr || !quiz) {
      return { success: false, error: 'Target assessment not found.' };
    }

    if (!quiz.is_open) {
      return { success: false, error: 'This assessment session has been closed.' };
    }

    // A student may only submit to an assessment of their own cohort/semester.
    if (quiz.semester_id !== student.semester_id) {
      return { success: false, error: 'This assessment does not belong to your cohort.' };
    }

    // Re-verify the session PIN (always required: a quiz without a PIN cannot be submitted)
    if (!codesMatch(quiz.session_pin, sessionPin)) {
      return { success: false, error: 'Valid active Session PIN is required to submit this assessment.' };
    }

    // 3 + 4. Double-check for a duplicate and load the answer keys (server-side only) together
    const [priorResult, questionsResult] = await Promise.all([
      supabase
        .from('ces_student_assessments')
        .select('id')
        .eq('student_id', student.id)
        .eq('quiz_id', quiz.id)
        .maybeSingle(),
      supabase.from('ces_quiz_questions').select('id, correct_option_index, marks').eq('quiz_id', quiz.id),
    ]);
    const priorSub = priorResult.data;

    if (priorSub) {
      return { success: false, error: 'Duplicate submission rejected. Assessment was already recorded.' };
    }

    const { data: questions, error: qErr } = questionsResult;

    if (qErr || !questions || questions.length === 0) {
      return { success: false, error: 'Failed to retrieve assessment questions for grading.' };
    }

    // 5. Evaluate answers and compute total score
    let calculatedScore = 0;
    for (const q of questions) {
      const studentChoice = answers[q.id];
      if (studentChoice !== undefined && studentChoice === q.correct_option_index) {
        calculatedScore += Number(q.marks);
      }
    }

    // Clamp score within 0 and max_score
    const maxScore = Number(quiz.max_score);
    const finalScore = Number(Math.min(maxScore, Math.max(0, calculatedScore)).toFixed(2));
    const percentage = Number(((finalScore / maxScore) * 100).toFixed(1));

    // 6. Write assessment record to database
    const { error: insErr } = await supabase
      .from('ces_student_assessments')
      .insert({
        student_id: student.id,
        quiz_id: quiz.id,
        score: finalScore,
        answer_payload: answers,
        is_manual_override: false,
      });

    if (insErr) {
      console.error('[Assessment Submission Insert Error]:', insErr);
      if (insErr.code === '23505') {
        return { success: false, error: 'You have already submitted this assessment.' };
      }
      return failWith('assessment', insErr, 'Failed to record score. Please try again.');
    }

    const fullName = `${student.first_name} ${student.surname}`;

    return {
      success: true,
      score: finalScore,
      maxScore,
      percentage,
      courseTitle: quiz.title,
      studentName: fullName,
      matricNo: student.matric_no,
    };
  } catch (err: unknown) {
    return failWith('assessment', err, 'Could not record your submission. Please try again.');
  }
}

/**
 * Teacher action: Fetches all quizzes for a cohort with PIN, status, and submission count
 */
export async function getTeacherQuizzesAction(cohortType: string = 'Regular') {
  try {
    await requireStaffUser();
    const supabase = createAdminClient();

    const { data: semester } = await supabase
      .from('ces_semesters')
      .select('id, name, type')
      .eq('type', cohortType)
      .eq('is_active', true)
      .maybeSingle();

    if (!semester) {
      return { success: false, error: `No active semester found for cohort: ${cohortType}` };
    }

    await ensureQuizzesSeeded(semester.id);

    const { data: quizzes, error } = await supabase
      .from('ces_quizzes')
      .select('id, course_code, title, assessment_type, max_score, session_pin, is_open')
      .eq('semester_id', semester.id)
      .order('created_at', { ascending: true });

    if (error) {
      return failWith('assessment', error, 'Something went wrong. Please try again.');
    }

    // Get submission count for each quiz
    const quizStats = await Promise.all(
      (quizzes || []).map(async (q) => {
        const { count: submissionCount } = await supabase
          .from('ces_student_assessments')
          .select('id', { count: 'exact', head: true })
          .eq('quiz_id', q.id);

        const { count: questionCount } = await supabase
          .from('ces_quiz_questions')
          .select('id', { count: 'exact', head: true })
          .eq('quiz_id', q.id);

        return {
          ...q,
          submissionCount: submissionCount || 0,
          questionCount: questionCount || 0,
        };
      })
    );

    return {
      success: true,
      semester: { id: semester.id, name: semester.name, type: semester.type },
      quizzes: quizStats,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve teacher quiz data';
    return { success: false, error: msg };
  }
}

/**
 * Teacher action: Updates session PIN and toggles is_open status
 */
export async function updateQuizSessionAction(input: QuizSessionUpdateInput) {
  try {
    await requireStaffUser();
    const parseResult = quizSessionUpdateSchema.safeParse(input);
    if (!parseResult.success) {
      const firstErr = parseResult.error.errors[0]?.message || 'Invalid update parameters';
      return { success: false, error: firstErr };
    }

    const { quizId, sessionPin, isOpen } = parseResult.data;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('ces_quizzes')
      .update({
        session_pin: sessionPin,
        is_open: isOpen,
      })
      .eq('id', quizId);

    if (error) {
      return failWith('assessment', error, 'Something went wrong. Please try again.');
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update quiz session';
    return { success: false, error: msg };
  }
}
