'use server';

import { createAdminClient } from '@/lib/supabase/admin';
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

// In-memory cache of verified seeded semesters to eliminate 10 redundant queries per request
const SEEDED_SEMESTERS_CACHE = new Set<string>();

/**
 * Ensures all standard courses and questions from curriculum are seeded
 * for an active semester if not already present.
 */
export async function ensureQuizzesAndQuestionsSeeded(semesterId: string): Promise<void> {
  if (SEEDED_SEMESTERS_CACHE.has(semesterId)) {
    return;
  }

  const supabase = createAdminClient();

  const { data: existingQuizzes, error: qErr } = await supabase
    .from('ces_quizzes')
    .select('id, course_code')
    .eq('semester_id', semesterId);

  if (qErr) {
    console.error('[Seeder] Error querying ces_quizzes:', qErr);
    return;
  }

  const existingCodes = new Set((existingQuizzes || []).map((q) => q.course_code));

  for (const course of CES_CURRICULUM) {
    let quizId: string;

    if (!existingCodes.has(course.code)) {
      const { data: newQuiz, error: insertQErr } = await supabase
        .from('ces_quizzes')
        .insert({
          semester_id: semesterId,
          course_code: course.code,
          title: course.title,
          assessment_type: course.type,
          max_score: course.maxScore,
          session_pin: course.defaultPin,
          is_open: true,
        })
        .select('id')
        .single();

      if (insertQErr || !newQuiz) {
        console.error(`[Seeder] Failed to insert quiz ${course.code}:`, insertQErr);
        continue;
      }
      quizId = newQuiz.id;
    } else {
      const found = existingQuizzes?.find((q) => q.course_code === course.code);
      quizId = found!.id;
    }

    // Check if questions exist for this quiz
    const { count } = await supabase
      .from('ces_quiz_questions')
      .select('id', { count: 'exact', head: true })
      .eq('quiz_id', quizId);

    if (!count || count === 0) {
      const questionsToInsert = course.questions.map((q, idx) => ({
        quiz_id: quizId,
        question_text: q.questionText,
        options: q.options,
        correct_option_index: q.correctOptionIndex,
        marks: q.marks,
        sort_order: idx + 1,
      }));

      const { error: insQuestErr } = await supabase
        .from('ces_quiz_questions')
        .insert(questionsToInsert);

      if (insQuestErr) {
        console.error(`[Seeder] Failed to seed questions for ${course.code}:`, insQuestErr);
      }
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
    await ensureQuizzesAndQuestionsSeeded(semester.id);

    // 2. Fetch quizzes (without leaking session PINs)
    const { data: quizzes, error } = await supabase
      .from('ces_quizzes')
      .select('id, course_code, title, assessment_type, max_score, is_open')
      .eq('semester_id', semester.id)
      .order('created_at', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      cohortType: semester.type,
      semesterName: semester.name,
      quizzes: quizzes || [],
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve assessment list';
    return { success: false, error: msg };
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

    const { matricNo, courseCode, sessionPin } = parseResult.data;
    const supabase = createAdminClient();

    // 1. Find and validate student
    const { data: student, error: studentErr } = await supabase
      .from('ces_students')
      .select('id, matric_no, surname, first_name, cohort_type, status, semester_id')
      .eq('matric_no', matricNo)
      .eq('is_deleted', false)
      .maybeSingle();

    if (studentErr || !student) {
      return {
        success: false,
        error: `No registered student found with matric number "${matricNo}". Please verify your credentials.`,
      };
    }

    if (student.status !== 'Active') {
      return {
        success: false,
        error: `Student status is ${student.status}. Only active students may take assessments.`,
      };
    }

    // 2. Ensure quizzes are seeded for the student's semester
    await ensureQuizzesAndQuestionsSeeded(student.semester_id);

    // 3. Find target quiz
    const { data: quiz, error: quizErr } = await supabase
      .from('ces_quizzes')
      .select('id, course_code, title, assessment_type, max_score, session_pin, is_open')
      .eq('semester_id', student.semester_id)
      .eq('course_code', courseCode)
      .maybeSingle();

    if (quizErr || !quiz) {
      return {
        success: false,
        error: `Assessment for course "${courseCode}" was not found in your cohort.`,
      };
    }

    // 4. Verify Quiz is Open
    if (!quiz.is_open) {
      return {
        success: false,
        error: `The assessment session for "${quiz.title}" is currently closed. Please ask your instructor to open the session.`,
      };
    }

    // 5. Verify Session PIN (case-insensitive)
    const expectedPin = (quiz.session_pin || '').trim().toUpperCase();
    if (!expectedPin || expectedPin !== sessionPin) {
      return {
        success: false,
        error: `Incorrect Session PIN for "${quiz.title}". Please request the active session PIN from your course instructor.`,
      };
    }

    // 6. Check for duplicate submission
    const { data: existingSubmission } = await supabase
      .from('ces_student_assessments')
      .select('id, score, submitted_at')
      .eq('student_id', student.id)
      .eq('quiz_id', quiz.id)
      .maybeSingle();

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

    // 7. Fetch questions and strip answer keys
    const { data: questions, error: questErr } = await supabase
      .from('ces_quiz_questions')
      .select('id, question_text, options, marks, sort_order')
      .eq('quiz_id', quiz.id)
      .order('sort_order', { ascending: true });

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
    console.error('[Verify Assessment Error]:', err);
    const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: msg };
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

    // 1. Validate student
    const { data: student, error: stuErr } = await supabase
      .from('ces_students')
      .select('id, surname, first_name, matric_no')
      .eq('matric_no', matricNo)
      .eq('is_deleted', false)
      .maybeSingle();

    if (stuErr || !student) {
      return { success: false, error: 'Student record could not be verified.' };
    }

    // 2. Validate quiz
    const { data: quiz, error: qzErr } = await supabase
      .from('ces_quizzes')
      .select('id, title, max_score, is_open, session_pin')
      .eq('id', quizId)
      .maybeSingle();

    if (qzErr || !quiz) {
      return { success: false, error: 'Target assessment not found.' };
    }

    if (!quiz.is_open) {
      return { success: false, error: 'This assessment session has been closed.' };
    }

    // Re-verify session PIN to ensure candidate is participating in authorized in-class session
    const expectedPin = (quiz.session_pin || '').trim().toUpperCase();
    if (expectedPin && (!sessionPin || sessionPin !== expectedPin)) {
      return { success: false, error: 'Valid active Session PIN is required to submit this assessment.' };
    }

    // 3. Double-check duplicate constraint before grading
    const { data: priorSub } = await supabase
      .from('ces_student_assessments')
      .select('id')
      .eq('student_id', student.id)
      .eq('quiz_id', quiz.id)
      .maybeSingle();

    if (priorSub) {
      return { success: false, error: 'Duplicate submission rejected. Assessment was already recorded.' };
    }

    // 4. Fetch questions with answer keys from database
    const { data: questions, error: qErr } = await supabase
      .from('ces_quiz_questions')
      .select('id, correct_option_index, marks')
      .eq('quiz_id', quiz.id);

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
      return { success: false, error: `Failed to record score: ${insErr.message}` };
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
    console.error('[Submit Assessment Error]:', err);
    const msg = err instanceof Error ? err.message : 'An unexpected error occurred during submission';
    return { success: false, error: msg };
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

    await ensureQuizzesAndQuestionsSeeded(semester.id);

    const { data: quizzes, error } = await supabase
      .from('ces_quizzes')
      .select('id, course_code, title, assessment_type, max_score, session_pin, is_open')
      .eq('semester_id', semester.id)
      .order('created_at', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
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
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update quiz session';
    return { success: false, error: msg };
  }
}
