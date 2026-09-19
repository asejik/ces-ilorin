import { describe, it, expect } from 'vitest';
import {
  calculateCumulativeScore,
  determineGraduationStatus,
  determineHonourClass,
  generateMatricNumber,
  validateQuizScore,
  validateExamScore,
} from '../academic';

describe('Academic Scoring Engine', () => {
  describe('calculateCumulativeScore', () => {
    it('returns null if either component is null', () => {
      expect(calculateCumulativeScore(null, 50)).toBeNull();
      expect(calculateCumulativeScore(30, null)).toBeNull();
      expect(calculateCumulativeScore(null, null)).toBeNull();
    });

    it('sums quiz total and final exam accurately', () => {
      expect(calculateCumulativeScore(35, 50)).toBe(85);
      expect(calculateCumulativeScore(33.5, 51)).toBe(84.5);
      expect(calculateCumulativeScore(40, 60)).toBe(100);
      expect(calculateCumulativeScore(0, 0)).toBe(0);
    });

    it('caps score between 0 and 100', () => {
      expect(calculateCumulativeScore(45, 65)).toBe(100);
    });
  });

  describe('determineHonourClass', () => {
    it('returns null if total score is null', () => {
      expect(determineHonourClass(null)).toBeNull();
    });

    it('awards Distinction for score >= 85', () => {
      expect(determineHonourClass(85)).toBe('Distinction');
      expect(determineHonourClass(85.5)).toBe('Distinction');
      expect(determineHonourClass(100)).toBe('Distinction');
      expect(determineHonourClass(90)).toBe('Distinction');
    });

    it('awards Merit for 75 <= score < 85', () => {
      expect(determineHonourClass(75)).toBe('Merit');
      expect(determineHonourClass(84.9)).toBe('Merit');
      expect(determineHonourClass(80)).toBe('Merit');
    });

    it('awards Pass for 50 <= score < 75', () => {
      expect(determineHonourClass(50)).toBe('Pass');
      expect(determineHonourClass(74.9)).toBe('Pass');
      expect(determineHonourClass(60)).toBe('Pass');
    });

    it('awards Below Pass for score < 50', () => {
      expect(determineHonourClass(49.9)).toBe('Below Pass');
      expect(determineHonourClass(0)).toBe('Below Pass');
      expect(determineHonourClass(35)).toBe('Below Pass');
    });
  });

  describe('determineGraduationStatus', () => {
    it('returns PENDING if any component is missing or incomplete', () => {
      expect(
        determineGraduationStatus({
          cumulativeTotal: null,
          elementaryPrinciples: 'Attended',
          membershipVision: 'Attended',
          allQuizzesEntered: true,
          examEntered: true,
        })
      ).toBe('⏳ PENDING');

      expect(
        determineGraduationStatus({
          cumulativeTotal: 85,
          elementaryPrinciples: null,
          membershipVision: 'Attended',
          allQuizzesEntered: true,
          examEntered: true,
        })
      ).toBe('⏳ PENDING');

      expect(
        determineGraduationStatus({
          cumulativeTotal: 85,
          elementaryPrinciples: 'Attended',
          membershipVision: 'Attended',
          allQuizzesEntered: false,
          examEntered: true,
        })
      ).toBe('⏳ PENDING');
    });

    it('returns GRADUATE if total >= 50 AND both courses are Attended', () => {
      expect(
        determineGraduationStatus({
          cumulativeTotal: 50,
          elementaryPrinciples: 'Attended',
          membershipVision: 'Attended',
          allQuizzesEntered: true,
          examEntered: true,
        })
      ).toBe('✅ GRADUATE');

      expect(
        determineGraduationStatus({
          cumulativeTotal: 92,
          elementaryPrinciples: 'Attended',
          membershipVision: 'Attended',
          allQuizzesEntered: true,
          examEntered: true,
        })
      ).toBe('✅ GRADUATE');
    });

    it('returns NOT YET if score < 50 even if attendance is complete', () => {
      expect(
        determineGraduationStatus({
          cumulativeTotal: 48,
          elementaryPrinciples: 'Attended',
          membershipVision: 'Attended',
          allQuizzesEntered: true,
          examEntered: true,
        })
      ).toBe('❌ NOT YET');
    });

    it('returns NOT YET if either attendance course is Not Attended or Excused', () => {
      expect(
        determineGraduationStatus({
          cumulativeTotal: 88,
          elementaryPrinciples: 'Attended',
          membershipVision: 'Not Attended',
          allQuizzesEntered: true,
          examEntered: true,
        })
      ).toBe('❌ NOT YET');

      expect(
        determineGraduationStatus({
          cumulativeTotal: 88,
          elementaryPrinciples: 'Excused',
          membershipVision: 'Attended',
          allQuizzesEntered: true,
          examEntered: true,
        })
      ).toBe('❌ NOT YET');
    });
  });

  describe('generateMatricNumber', () => {
    it('generates format CES/ILR/YY[MonthAlphabet][MonthDigit][Sequence]', () => {
      // August (8th month = H), 2026, sequence 1 -> CES/ILR/26H801
      expect(
        generateMatricNumber({
          year: 2026,
          month: 8,
          sequence: 1,
        })
      ).toBe('CES/ILR/26H801');

      // August, 2026, sequence 21 -> CES/ILR/26H821
      expect(
        generateMatricNumber({
          year: 2026,
          month: 8,
          sequence: 21,
        })
      ).toBe('CES/ILR/26H821');

      // January (1st month = A), 2026, sequence 5 -> CES/ILR/26A105
      expect(
        generateMatricNumber({
          year: 2026,
          month: 1,
          sequence: 5,
        })
      ).toBe('CES/ILR/26A105');
    });
  });

  describe('Score Cap Validation', () => {
    it('validates quiz scores between 0 and 5', () => {
      expect(validateQuizScore(0)).toBe(true);
      expect(validateQuizScore(3.5)).toBe(true);
      expect(validateQuizScore(5)).toBe(true);
      expect(validateQuizScore(5.5)).toBe(false);
      expect(validateQuizScore(-1)).toBe(false);
    });

    it('validates final exam scores between 0 and 60', () => {
      expect(validateExamScore(0)).toBe(true);
      expect(validateExamScore(30)).toBe(true);
      expect(validateExamScore(60)).toBe(true);
      expect(validateExamScore(61)).toBe(false);
      expect(validateExamScore(-5)).toBe(false);
    });
  });
});
