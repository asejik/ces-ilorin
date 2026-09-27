import { z } from 'zod';

export const ATTENDANCE_COURSE_NAMES = [
  // 8 Modular Curriculum Courses
  'Doctrine of Salvation',
  'Righteousness of God',
  'Integrity of the Word of God',
  'The Love Walk & Christian Character',
  'Ministry of Service & Church Stewardship',
  'Spiritual Authority & Believer’s Rights',
  'Person and Power of the Holy Spirit',
  'Prevailing Prayer & Intercession',

  // Core Mandatory Institutional Classes (Required for Graduation)
  'Elementary Principles',
  'Membership & Vision Class',

  // Cohort & General Training Sessions
  'General Sunday Cohort Session',
  'Comprehensive Review & Final Exam Preparation',
  'Special Discipleship Seminar / Workshop',
] as const;

export interface AttendanceCourseGroup {
  groupName: string;
  courses: readonly string[];
}

export const ATTENDANCE_COURSE_GROUPS: AttendanceCourseGroup[] = [
  {
    groupName: 'Curriculum Course Lessons (8 Modules)',
    courses: [
      'Doctrine of Salvation',
      'Righteousness of God',
      'Integrity of the Word of God',
      'The Love Walk & Christian Character',
      'Ministry of Service & Church Stewardship',
      'Spiritual Authority & Believer’s Rights',
      'Person and Power of the Holy Spirit',
      'Prevailing Prayer & Intercession',
    ],
  },
  {
    groupName: 'Mandatory Institutional Classes (Required for Graduation)',
    courses: [
      'Elementary Principles',
      'Membership & Vision Class',
    ],
  },
  {
    groupName: 'Cohort & Special Training Sessions',
    courses: [
      'General Sunday Cohort Session',
      'Comprehensive Review & Final Exam Preparation',
      'Special Discipleship Seminar / Workshop',
    ],
  },
];

export const attendanceCheckinSchema = z.object({
  matricNo: z
    .string()
    .min(1, 'Matriculation number is required')
    .transform((val) => val.trim().toUpperCase()),
  courseName: z.enum(ATTENDANCE_COURSE_NAMES, {
    errorMap: () => ({ message: 'Please select a valid course session' }),
  }),
  sessionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date in YYYY-MM-DD format')
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : undefined)),
  deliveryRating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating must be at most 5 stars'),
  deliveryFeedback: z
    .string()
    .max(500, 'Feedback must not exceed 500 characters')
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim() : null)),
});

export const scoreOverrideSchema = z.object({
  studentId: z.string().uuid('Invalid Student ID'),
  quizId: z.string().uuid('Invalid Quiz ID'),
  newScore: z
    .number()
    .min(0, 'Score cannot be negative')
    .max(60, 'Score cannot exceed maximum allowed marks'),
  maxScore: z.number().min(1, 'Invalid max score'),
  reason: z
    .string()
    .min(5, 'A clear reason for the score override is required (minimum 5 characters)')
    .max(250, 'Reason must not exceed 250 characters')
    .transform((val) => val.trim()),
}).refine((data) => data.newScore <= data.maxScore, {
  message: 'New score cannot exceed the maximum score for this assessment',
  path: ['newScore'],
});

export const attendanceOverrideSchema = z.object({
  studentId: z.string().uuid('Invalid Student ID'),
  semesterId: z.string().uuid('Invalid Semester ID'),
  courseName: z.string().min(1, 'Course name is required'),
  status: z.enum(['Attended', 'Not Attended', 'Excused'], {
    errorMap: () => ({ message: 'Status must be Attended, Not Attended, or Excused' }),
  }),
});

export type AttendanceCheckinInput = z.infer<typeof attendanceCheckinSchema>;
export type ScoreOverrideInput = z.infer<typeof scoreOverrideSchema>;
export type AttendanceOverrideInput = z.infer<typeof attendanceOverrideSchema>;
