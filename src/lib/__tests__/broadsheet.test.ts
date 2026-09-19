import { describe, it, expect } from 'vitest';
import {
  generateCertificateNumber,
  formatCertificateDate,
  getHonourBadgeDetails,
} from '../certificate';
import {
  calculateCumulativeScore,
  determineGraduationStatus,
  determineHonourClass,
} from '../academic';
import { buildBroadsheetWorkbook } from '../excel';
import type { StudentBroadsheetRow, BroadsheetKPIs } from '../../types/broadsheet';

describe('Milestone M5: Certificate Utilities', () => {
  describe('generateCertificateNumber', () => {
    it('generates standard certificate number from official matriculation number', () => {
      expect(generateCertificateNumber('CES/ILR/26I901')).toBe('CERT-CES-26I901');
      expect(generateCertificateNumber('CES/ILR/26H802')).toBe('CERT-CES-26H802');
    });

    it('handles whitespace, lowercase, and special characters cleanly', () => {
      expect(generateCertificateNumber('  ces/ilr/26a105  ')).toBe('CERT-CES-26A105');
      expect(generateCertificateNumber('ces-ilr-26b210')).toBe('CERT-CES-26B210');
    });

    it('throws error on empty or invalid matric number', () => {
      expect(() => generateCertificateNumber('')).toThrow('Valid matriculation number is required');
      // @ts-expect-error testing invalid type
      expect(() => generateCertificateNumber(null)).toThrow('Valid matriculation number is required');
    });
  });

  describe('formatCertificateDate', () => {
    it('formats dates with appropriate ordinal day suffixes', () => {
      // 1st, 2nd, 3rd, 4th
      expect(formatCertificateDate(new Date(2026, 8, 1))).toBe('1st September, 2026');
      expect(formatCertificateDate(new Date(2026, 8, 2))).toBe('2nd September, 2026');
      expect(formatCertificateDate(new Date(2026, 8, 3))).toBe('3rd September, 2026');
      expect(formatCertificateDate(new Date(2026, 8, 4))).toBe('4th September, 2026');
    });

    it('formats teen days with "th" suffix correctly', () => {
      expect(formatCertificateDate(new Date(2026, 8, 11))).toBe('11th September, 2026');
      expect(formatCertificateDate(new Date(2026, 8, 12))).toBe('12th September, 2026');
      expect(formatCertificateDate(new Date(2026, 8, 13))).toBe('13th September, 2026');
    });

    it('formats 21st, 22nd, 23rd, 31st correctly', () => {
      expect(formatCertificateDate(new Date(2026, 8, 21))).toBe('21st September, 2026');
      expect(formatCertificateDate(new Date(2026, 8, 22))).toBe('22nd September, 2026');
      expect(formatCertificateDate(new Date(2026, 8, 23))).toBe('23rd September, 2026');
      expect(formatCertificateDate(new Date(2026, 7, 31))).toBe('31st August, 2026');
    });

    it('handles ISO string input and invalid dates gracefully', () => {
      expect(formatCertificateDate('2026-09-19T10:00:00Z')).toContain('September, 2026');
      expect(formatCertificateDate('invalid-date')).toBe('19th September, 2026');
    });
  });

  describe('getHonourBadgeDetails', () => {
    it('returns gold foil tokens for Distinction', () => {
      const info = getHonourBadgeDetails('Distinction');
      expect(info.label).toBe('DISTINCTION');
      expect(info.isFoil).toBe(true);
      expect(info.description).toContain('≥ 85%');
    });

    it('returns appropriate tokens for Merit and Pass', () => {
      const merit = getHonourBadgeDetails('Merit');
      expect(merit.label).toBe('MERIT');
      expect(merit.isFoil).toBe(false);

      const pass = getHonourBadgeDetails('Pass');
      expect(pass.label).toBe('PASS');
      expect(pass.isFoil).toBe(false);
    });

    it('returns below pass tokens for unranked or below pass', () => {
      const below = getHonourBadgeDetails('Below Pass');
      expect(below.label).toBe('BELOW PASS');
      expect(below.isFoil).toBe(false);

      const none = getHonourBadgeDetails(null);
      expect(none.label).toBe('BELOW PASS');
    });
  });
});

describe('Milestone M5: Broadsheet Clearance & Honours Rules', () => {
  it('clears student for graduation and awards Distinction for score >= 85 with both classes attended', () => {
    const quizTotal = 38.0;
    const finalExam = 52.0;
    const cumulative = calculateCumulativeScore(quizTotal, finalExam); // 90.0

    const clearance = determineGraduationStatus({
      cumulativeTotal: cumulative,
      elementaryPrinciples: 'Attended',
      membershipVision: 'Attended',
      allQuizzesEntered: true,
      examEntered: true,
    });

    const honours = determineHonourClass(cumulative);

    expect(clearance).toBe('✅ GRADUATE');
    expect(honours).toBe('Distinction');
  });

  it('awards Merit for score 75 to 84.9 with clearance', () => {
    const cumulative = calculateCumulativeScore(32.0, 46.0); // 78.0
    const clearance = determineGraduationStatus({
      cumulativeTotal: cumulative,
      elementaryPrinciples: 'Attended',
      membershipVision: 'Attended',
      allQuizzesEntered: true,
      examEntered: true,
    });
    const honours = determineHonourClass(cumulative);

    expect(clearance).toBe('✅ GRADUATE');
    expect(honours).toBe('Merit');
  });

  it('rejects graduation if attendance is missing even with 100% score', () => {
    const cumulative = calculateCumulativeScore(40.0, 60.0); // 100.0
    const clearance = determineGraduationStatus({
      cumulativeTotal: cumulative,
      elementaryPrinciples: 'Attended',
      membershipVision: null, // Unrecorded
      allQuizzesEntered: true,
      examEntered: true,
    });

    expect(clearance).toBe('⏳ PENDING');
  });

  it('marks as NOT YET if total score is below 50 even if attendance is attended', () => {
    const cumulative = calculateCumulativeScore(20.0, 25.0); // 45.0
    const clearance = determineGraduationStatus({
      cumulativeTotal: cumulative,
      elementaryPrinciples: 'Attended',
      membershipVision: 'Attended',
      allQuizzesEntered: true,
      examEntered: true,
    });
    const honours = determineHonourClass(cumulative);

    expect(clearance).toBe('❌ NOT YET');
    expect(honours).toBe('Below Pass');
  });
});

describe('Milestone M5: Excel Broadsheet Export', () => {
  it('builds an official Excel workbook and returns standard filename pattern', () => {
    const mockRows: StudentBroadsheetRow[] = [
      {
        studentId: 'stu-1',
        matricNo: 'CES/ILR/26I901',
        fullName: 'Sogo Ayenigba',
        passportUrl: null,
        cohortType: 'Regular',
        status: 'Active',
        quizzes: {
          salvation: { score: 5, maxScore: 5, isOverride: false, quizId: 'q1' },
          righteousness: { score: 4.5, maxScore: 5, isOverride: true, quizId: 'q2' },
          word_of_god: { score: 5, maxScore: 5, isOverride: false, quizId: 'q3' },
          love_walk: { score: 5, maxScore: 5, isOverride: false, quizId: 'q4' },
          service: { score: 5, maxScore: 5, isOverride: false, quizId: 'q5' },
          spiritual_authority: { score: 5, maxScore: 5, isOverride: false, quizId: 'q6' },
          holy_spirit: { score: 5, maxScore: 5, isOverride: false, quizId: 'q7' },
          prayer: { score: 5, maxScore: 5, isOverride: false, quizId: 'q8' },
        },
        quizTotal: 39.5,
        finalExam: { score: 55, maxScore: 60, isOverride: false, quizId: 'exam' },
        cumulativeTotal: 94.5,
        elementaryPrinciples: 'Attended',
        membershipVision: 'Attended',
        graduationStatus: '✅ GRADUATE',
        honourClass: 'Distinction',
        certificateId: 'cert-1',
        certificateNo: 'CERT-CES-26I901',
        certificateIssuedAt: '2026-09-19T12:00:00Z',
        certificatePdfUrl: null,
      },
    ];

    const mockKpis: BroadsheetKPIs = {
      totalStudents: 1,
      graduatesCount: 1,
      pendingCount: 0,
      notYetCount: 0,
      averageScore: 94.5,
      distinctionCount: 1,
      meritCount: 0,
      passCount: 0,
    };

    const { workbook, filename } = buildBroadsheetWorkbook({
      cohortName: 'Regular',
      semesterName: 'Regular Cohort — 2026',
      rows: mockRows,
      kpis: mockKpis,
    });

    expect(workbook).toBeDefined();
    expect(workbook.SheetNames).toContain('Broadsheet');
    expect(filename).toMatch(/^CES_Broadsheet_Regular_\d{4}-\d{2}-\d{2}\.xlsx$/);

    const sheet = workbook.Sheets['Broadsheet'];
    expect(sheet).toBeDefined();
    // Check cell A1 has church title
    expect(sheet['A1']?.v).toBe('CITIZENS OF LIGHT CHURCH');
    expect(sheet['A2']?.v).toContain('CITIZENS ELEMENTARY SCHOOL');
  });
});
