/** Rows Supabase's REST API returns per request by default (extra rows are silently dropped). */
export const PAGE_SIZE = 1000;

interface PageResult<T> {
  data: T[] | null;
  error: { message: string } | null;
}

/**
 * Reads every row of a query by requesting it page by page.
 * Supabase caps a single response at 1,000 rows WITHOUT raising an error, so a plain
 * select on a large cohort would quietly lose scores. `page` must use a stable order
 * (for example `.order('id')`) so pages never overlap or skip rows.
 */
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize: number = PAGE_SIZE
): Promise<{ data: T[]; error: { message: string } | null }> {
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) return { data: [], error };
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  return { data: all, error: null };
}

/** Splits a list into chunks so a long `.in()` filter never exceeds URL length limits. */
export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
