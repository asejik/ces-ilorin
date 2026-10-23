import { describe, it, expect } from 'vitest';
import { lagosDateParts, lagosToday } from '../lagos-time';
import { generateMatricNumber } from '../academic';

describe('Nigeria (Africa/Lagos) dates', () => {
  it('rolls into the next month at 23:00 UTC, which is midnight in Nigeria', () => {
    // 30 Sep 2026 23:30 UTC = 1 Oct 2026 00:30 Lagos
    const d = new Date('2026-09-30T23:30:00Z');
    expect(lagosDateParts(d)).toEqual({ year: 2026, month: 10, day: 1 });
    expect(lagosToday(d)).toBe('2026-10-01');
  });

  it('does not roll early one minute before Nigerian midnight', () => {
    const d = new Date('2026-09-30T22:59:00Z'); // 23:59 Lagos on 30 Sep
    expect(lagosDateParts(d)).toEqual({ year: 2026, month: 9, day: 30 });
  });

  it('rolls into the next year at the new-year boundary', () => {
    const d = new Date('2026-12-31T23:10:00Z');
    expect(lagosDateParts(d)).toEqual({ year: 2027, month: 1, day: 1 });
  });

  it('gives the matric number the Nigerian month, not the UTC month', () => {
    const { year, month } = lagosDateParts(new Date('2026-07-31T23:30:00Z')); // 1 Aug in Lagos
    expect(generateMatricNumber({ year, month, sequence: 1 })).toBe('CES/ILR/26H801');
  });

  it('pads single-digit months and days', () => {
    expect(lagosToday(new Date('2026-03-05T12:00:00Z'))).toBe('2026-03-05');
  });
});
