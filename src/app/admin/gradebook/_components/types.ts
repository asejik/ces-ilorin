export type CohortFilter = 'Regular' | 'Sunday Cohort';

export type StatusFilter = 'ALL' | 'GRADUATE' | 'PENDING' | 'NOT_YET';

export interface GradebookKpis {
  totalStudents: number;
  graduatesCount: number;
  pendingCount: number;
  averageScore: number;
}

export interface OverrideTarget {
  studentId: string;
  studentName: string;
  matricNo: string;
  quizId: string;
  courseTitle: string;
  currentScore: number | null;
  maxScore: number;
}
