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

export const QUIZ_COLUMNS = [
  { code: 'salvation', short: 'Salv', name: 'Salvation' },
  { code: 'righteousness', short: 'Rght', name: 'Righteousness' },
  { code: 'word_of_god', short: 'Word', name: 'Word of God' },
  { code: 'love_walk', short: 'Love', name: 'Love Walk' },
  { code: 'service', short: 'Serv', name: 'Service' },
  { code: 'spiritual_authority', short: 'Auth', name: 'Authority' },
  { code: 'holy_spirit', short: 'Spir', name: 'Holy Spirit' },
  { code: 'prayer', short: 'Pray', name: 'Prayer' },
];
