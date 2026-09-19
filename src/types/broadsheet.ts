import type { AttendanceStatus, GraduationStatus, HonourClass } from './database';

export interface BroadsheetQuizInfo {
  score: number | null;
  maxScore: number;
  isOverride: boolean;
  overrideReason?: string | null;
  quizId: string;
}

export interface StudentBroadsheetRow {
  studentId: string;
  matricNo: string;
  fullName: string;
  passportUrl: string | null;
  cohortType: string;
  status: string;

  // 8 Quiz Scores
  quizzes: Record<string, BroadsheetQuizInfo>;

  // Aggregates
  quizTotal: number | null;
  finalExam: BroadsheetQuizInfo | null;
  cumulativeTotal: number | null;

  // Mandatory Attendance
  elementaryPrinciples: AttendanceStatus | null;
  membershipVision: AttendanceStatus | null;

  // Clearance & Honours
  graduationStatus: GraduationStatus;
  honourClass: HonourClass | null;

  // Certificate Issuance Record
  certificateId: string | null;
  certificateNo: string | null;
  certificateIssuedAt: string | null;
  certificatePdfUrl: string | null;
}

export interface BroadsheetKPIs {
  totalStudents: number;
  graduatesCount: number;
  pendingCount: number;
  notYetCount: number;
  averageScore: number;
  distinctionCount: number;
  meritCount: number;
  passCount: number;
}

export interface BroadsheetResponse {
  success: boolean;
  error?: string;
  semester?: {
    id: string;
    name: string;
    type: string;
  };
  rows?: StudentBroadsheetRow[];
  kpis?: BroadsheetKPIs;
}

export interface CertificateDetails {
  id: string;
  certificateNo: string;
  studentId: string;
  studentName: string;
  matricNo: string;
  passportUrl: string | null;
  cohortName: string;
  cohortType: string;
  cumulativeTotal: number;
  honourClass: HonourClass;
  issuedAt: string;
  formattedIssuedDate: string;
}
