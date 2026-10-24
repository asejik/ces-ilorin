import { describe, it, expect } from 'vitest';
import { createSemesterSchema } from '../validation/semester';

const ok = { name: 'Regular Cohort — Jan 2027', type: 'Regular', year: 2027, makeActive: true };

describe('createSemesterSchema', () => {
  it('accepts a valid semester and trims the name', () => {
    const r = createSemesterSchema.safeParse({ ...ok, name: '  Sunday Cohort 2027  ', type: 'Sunday Cohort' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe('Sunday Cohort 2027');
  });

  it('rejects unknown cohort types', () => {
    expect(createSemesterSchema.safeParse({ ...ok, type: 'Weekend' }).success).toBe(false);
  });

  it('rejects short names and silly years', () => {
    expect(createSemesterSchema.safeParse({ ...ok, name: 'ab' }).success).toBe(false);
    expect(createSemesterSchema.safeParse({ ...ok, year: 1999 }).success).toBe(false);
    expect(createSemesterSchema.safeParse({ ...ok, year: 2026.5 }).success).toBe(false);
  });
});
