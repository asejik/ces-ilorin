import { describe, it, expect } from 'vitest';
import {
  attendanceCheckinSchema,
  scoreOverrideSchema,
  attendanceOverrideSchema,
} from '../validation/attendance';
import { determineGraduationStatus } from '../academic';

describe('Attendance Validation Schemas', () => {
  it('validates a correct attendance check-in with rating and feedback', () => {
    const valid = {
      matricNo: '  ces/ilr/26i901  ',
      courseName: 'Elementary Principles',
      deliveryRating: 5,
      deliveryFeedback: 'The class was deeply transformative and clear.',
    };

    const parsed = attendanceCheckinSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.matricNo).toBe('CES/ILR/26I901');
      expect(parsed.data.courseName).toBe('Elementary Principles');
      expect(parsed.data.deliveryRating).toBe(5);
      expect(parsed.data.deliveryFeedback).toBe('The class was deeply transformative and clear.');
    }
  });

  it('rejects invalid star rating outside 1..5', () => {
    const invalidZero = {
      matricNo: 'CES/ILR/26I901',
      courseName: 'Elementary Principles',
      deliveryRating: 0,
    };
    expect(attendanceCheckinSchema.safeParse(invalidZero).success).toBe(false);

    const invalidSix = {
      matricNo: 'CES/ILR/26I901',
      courseName: 'Elementary Principles',
      deliveryRating: 6,
    };
    expect(attendanceCheckinSchema.safeParse(invalidSix).success).toBe(false);
  });

  it('rejects unapproved course names for attendance', () => {
    const invalidCourse = {
      matricNo: 'CES/ILR/26I901',
      courseName: 'Unapproved Theology Class',
      deliveryRating: 4,
    };
    expect(attendanceCheckinSchema.safeParse(invalidCourse).success).toBe(false);
  });
});

describe('Score Override Schema', () => {
  it('validates a legitimate score override with reason', () => {
    const valid = {
      studentId: '11111111-1111-1111-1111-111111111111',
      quizId: '22222222-2222-2222-2222-222222222222',
      newScore: 4.5,
      maxScore: 5.0,
      reason: 'Completed make-up test on paper due to device battery failure.',
    };

    const parsed = scoreOverrideSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('rejects an override score exceeding maxScore (e.g. 5.5 / 5.0)', () => {
    const invalid = {
      studentId: '11111111-1111-1111-1111-111111111111',
      quizId: '22222222-2222-2222-2222-222222222222',
      newScore: 5.5,
      maxScore: 5.0,
      reason: 'Accidental bonus marks',
    };

    const parsed = scoreOverrideSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('rejects an override with an empty or too short reason (< 5 chars)', () => {
    const invalid = {
      studentId: '11111111-1111-1111-1111-111111111111',
      quizId: '22222222-2222-2222-2222-222222222222',
      newScore: 4.0,
      maxScore: 5.0,
      reason: 'ok', // too short
    };

    const parsed = scoreOverrideSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });
});

describe('Attendance Override Schema', () => {
  it('validates attendance status choices', () => {
    const valid = {
      studentId: '11111111-1111-1111-1111-111111111111',
      semesterId: '22222222-2222-2222-2222-222222222222',
      courseName: 'Membership & Vision Class',
      status: 'Attended' as const,
    };

    expect(attendanceOverrideSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid attendance status', () => {
    const invalid = {
      studentId: '11111111-1111-1111-1111-111111111111',
      semesterId: '22222222-2222-2222-2222-222222222222',
      courseName: 'Membership & Vision Class',
      status: 'Present', // invalid, must be Attended/Not Attended/Excused
    };

    expect(attendanceOverrideSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('Graduation Clearance with Attendance Verification', () => {
  it('returns PENDING when student has passing score but attendance is unrecorded', () => {
    const status = determineGraduationStatus({
      cumulativeTotal: 78.0,
      elementaryPrinciples: null, // missing attendance
      membershipVision: 'Attended',
      allQuizzesEntered: true,
      examEntered: true,
    });
    expect(status).toBe('⏳ PENDING');
  });

  it('returns GRADUATE when student has passing score and both mandatory attendances completed', () => {
    const status = determineGraduationStatus({
      cumulativeTotal: 78.0,
      elementaryPrinciples: 'Attended',
      membershipVision: 'Attended',
      allQuizzesEntered: true,
      examEntered: true,
    });
    expect(status).toBe('✅ GRADUATE');
  });

  it('returns NOT YET when student has passing score but failed attendance (Not Attended)', () => {
    const status = determineGraduationStatus({
      cumulativeTotal: 88.0,
      elementaryPrinciples: 'Not Attended',
      membershipVision: 'Attended',
      allQuizzesEntered: true,
      examEntered: true,
    });
    expect(status).toBe('❌ NOT YET');
  });
});
