import { z } from 'zod';

export const COHORT_TYPES = ['Regular', 'Sunday Cohort'] as const;

export const createSemesterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Name must be at least 3 characters')
    .max(80, 'Name must be 80 characters or fewer'),
  type: z.enum(COHORT_TYPES, { errorMap: () => ({ message: 'Choose a cohort type' }) }),
  year: z.number().int().min(2024, 'Year looks wrong').max(2100, 'Year looks wrong'),
  makeActive: z.boolean(),
});

export type CreateSemesterInput = z.infer<typeof createSemesterSchema>;
