import { CES_CURRICULUM } from '@/lib/curriculum';

export type AssessmentStep = 'access' | 'confirm' | 'taking' | 'result';

export type CohortFilter = 'Regular' | 'Sunday Cohort';

export interface AvailableQuiz {
  id: string;
  course_code: string;
  title: string;
  assessment_type: 'quiz' | 'final_exam';
  max_score: number;
  is_open: boolean;
}

export interface CandidateInfo {
  id: string;
  matricNo: string;
  fullName: string;
  cohortType: string;
}

export interface QuizInfo {
  id: string;
  courseCode: string;
  title: string;
  assessmentType: 'quiz' | 'final_exam';
  maxScore: number;
  questionCount: number;
}

/** Fallback list shown before the live quiz list loads (catalogue only; no answers). */
export const DEFAULT_AVAILABLE_QUIZZES: AvailableQuiz[] = CES_CURRICULUM.map((course) => ({
  id: course.code,
  course_code: course.code,
  title: course.title,
  assessment_type: course.type,
  max_score: course.maxScore,
  is_open: true,
}));
