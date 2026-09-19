import { GraduationStatus, HonourClass, AttendanceStatus } from '@/types/database';

export const QUIZ_COURSES = [
  { code: 'salvation', name: 'Salvation', maxScore: 5 },
  { code: 'righteousness', name: 'Righteousness', maxScore: 5 },
  { code: 'word_of_god', name: 'Word of God', maxScore: 5 },
  { code: 'love_walk', name: 'Love Walk', maxScore: 5 },
  { code: 'service', name: 'Service', maxScore: 5 },
  { code: 'spiritual_authority', name: 'Spiritual Authority', maxScore: 5 },
  { code: 'holy_spirit', name: 'Holy Spirit', maxScore: 5 },
  { code: 'prayer', name: 'Prayer', maxScore: 5 },
] as const;

export const ATTENDANCE_COURSES = [
  { code: 'elementary_principles', name: 'Elementary Principles' },
  { code: 'membership_vision', name: 'Membership & Vision Class' },
] as const;

/**
 * Calculates cumulative score: Quiz Total (/40) + Final Exam (/60) = Total (/100)
 */
export function calculateCumulativeScore(
  quizTotal: number | null,
  finalExam: number | null
): number | null {
  if (quizTotal === null || finalExam === null) {
    return null;
  }
  const total = Number((quizTotal + finalExam).toFixed(2));
  return Math.min(100, Math.max(0, total));
}

/**
 * Determines graduation eligibility based on strict institutional rules:
 * - GRADUATE: Total >= 50 AND Elementary Principles = 'Attended' AND Membership & Vision = 'Attended'
 * - NOT YET: Data complete but criteria not met
 * - PENDING: Any required quiz, exam, or attendance is unrecorded / missing
 */
export function determineGraduationStatus(params: {
  cumulativeTotal: number | null;
  elementaryPrinciples: AttendanceStatus | null;
  membershipVision: AttendanceStatus | null;
  allQuizzesEntered: boolean;
  examEntered: boolean;
}): GraduationStatus {
  const { cumulativeTotal, elementaryPrinciples, membershipVision, allQuizzesEntered, examEntered } = params;

  // If any score or attendance record is missing, student is PENDING
  if (
    cumulativeTotal === null ||
    elementaryPrinciples === null ||
    membershipVision === null ||
    !allQuizzesEntered ||
    !examEntered
  ) {
    return '⏳ PENDING';
  }

  const hasPassingScore = cumulativeTotal >= 50;
  const hasCompletedAttendance =
    elementaryPrinciples === 'Attended' && membershipVision === 'Attended';

  if (hasPassingScore && hasCompletedAttendance) {
    return '✅ GRADUATE';
  }

  return '❌ NOT YET';
}

/**
 * Determines honour classification:
 * Distinction >= 85
 * Merit >= 75
 * Pass >= 50
 * Below Pass < 50
 */
export function determineHonourClass(totalScore: number | null): HonourClass | null {
  if (totalScore === null) return null;

  if (totalScore >= 85) return 'Distinction';
  if (totalScore >= 75) return 'Merit';
  if (totalScore >= 50) return 'Pass';
  return 'Below Pass';
}

/**
 * Month alphabet mapping: 1=A, 2=B, ..., 8=H, ..., 12=L
 */
const MONTH_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const;

/**
 * Generates official matriculation number:
 * Pattern: CES/ILR/YY[MonthAlphabet][MonthDigit][Sequence]
 * Example: For August (month 8), 2026, sequence 1:
 * -> CES/ILR/26H801
 */
export function generateMatricNumber(params: {
  year: number; // e.g. 2026
  month: number; // 1 - 12
  sequence: number; // e.g. 1, 2, 3
}): string {
  const yy = String(params.year).slice(-2);
  const monthIdx = Math.max(1, Math.min(12, params.month)) - 1;
  const monthLetter = MONTH_LETTERS[monthIdx];
  const monthDigit = String(params.month);
  
  // Format sequence with 2 digits or 3 digits (e.g. 01, 02)
  // Example in PRD: H801 (MonthLetter=H, MonthDigit=8, Sequence=01)
  const seqPadded = params.sequence < 10 ? `0${params.sequence}` : String(params.sequence);

  return `CES/ILR/${yy}${monthLetter}${monthDigit}${seqPadded}`;
}

/**
 * Validates quiz score cap (0 to 5)
 */
export function validateQuizScore(score: number): boolean {
  return typeof score === 'number' && !isNaN(score) && score >= 0 && score <= 5;
}

/**
 * Validates final exam score cap (0 to 60)
 */
export function validateExamScore(score: number): boolean {
  return typeof score === 'number' && !isNaN(score) && score >= 0 && score <= 60;
}
