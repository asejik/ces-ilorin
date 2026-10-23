const LAGOS_TZ = 'Africa/Lagos';

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: LAGOS_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export interface LagosDateParts {
  year: number;
  month: number; // 1-12
  day: number;
}

/**
 * Calendar date in Nigeria (Africa/Lagos, UTC+1), whatever time zone the server runs in.
 * Vercel servers run in UTC, so `new Date().getMonth()` would give the wrong month between
 * 00:00 and 01:00 Nigerian time on the 1st of a month.
 */
export function lagosDateParts(date: Date = new Date()): LagosDateParts {
  const parts = formatter.formatToParts(date);
  const pick = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: pick('year'), month: pick('month'), day: pick('day') };
}

/** Today's date in Nigeria as YYYY-MM-DD. */
export function lagosToday(date: Date = new Date()): string {
  const { year, month, day } = lagosDateParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
