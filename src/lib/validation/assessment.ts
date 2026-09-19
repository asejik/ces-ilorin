import { z } from 'zod';

export const assessmentAccessSchema = z.object({
  matricNo: z
    .string()
    .min(1, 'Matriculation number is required')
    .transform((val) => val.trim().toUpperCase()),
  courseCode: z
    .string()
    .min(1, 'Course selection is required')
    .transform((val) => val.trim().toLowerCase()),
  sessionPin: z
    .string()
    .min(1, 'Session PIN is required')
    .transform((val) => val.trim().toUpperCase()),
});

export const assessmentSubmissionSchema = z.object({
  matricNo: z
    .string()
    .min(1, 'Matriculation number is required')
    .transform((val) => val.trim().toUpperCase()),
  quizId: z.string().uuid('Invalid Quiz ID'),
  sessionPin: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? val.trim().toUpperCase() : undefined)),
  answers: z.record(
    z.string().uuid('Invalid Question ID'),
    z.number().int().min(0).max(3, 'Option index must be between 0 and 3')
  ),
});

export const quizSessionUpdateSchema = z.object({
  quizId: z.string().uuid('Invalid Quiz ID'),
  sessionPin: z
    .string()
    .min(3, 'PIN must be at least 3 characters')
    .max(16, 'PIN must be at most 16 characters')
    .transform((val) => val.trim().toUpperCase()),
  isOpen: z.boolean(),
});

export type AssessmentAccessInput = z.infer<typeof assessmentAccessSchema>;
export type AssessmentSubmissionInput = z.infer<typeof assessmentSubmissionSchema>;
export type QuizSessionUpdateInput = z.infer<typeof quizSessionUpdateSchema>;
