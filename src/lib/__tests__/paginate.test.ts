import { describe, it, expect } from 'vitest';
import { chunk, fetchAll } from '../paginate';

/** Fake table that behaves like Supabase: never returns more than `cap` rows per request. */
function fakeTable(total: number, cap = 1000) {
  const rows = Array.from({ length: total }, (_, i) => ({ id: i + 1 }));
  let calls = 0;
  return {
    calls: () => calls,
    page: async (from: number, to: number) => {
      calls++;
      const end = Math.min(to, from + cap - 1);
      return { data: rows.slice(from, end + 1), error: null };
    },
  };
}

describe('fetchAll (1,000-row response cap)', () => {
  it('returns every row for 2,345 rows (3 pages)', async () => {
    const t = fakeTable(2345);
    const { data, error } = await fetchAll(t.page);
    expect(error).toBeNull();
    expect(data).toHaveLength(2345);
    expect(new Set(data.map((r) => r.id)).size).toBe(2345);
    expect(t.calls()).toBe(3);
  });

  it('handles an exact multiple of the page size', async () => {
    const t = fakeTable(2000);
    const { data } = await fetchAll(t.page);
    expect(data).toHaveLength(2000);
  });

  it('handles empty and small results', async () => {
    expect((await fetchAll(fakeTable(0).page)).data).toHaveLength(0);
    expect((await fetchAll(fakeTable(5).page)).data).toHaveLength(5);
  });

  it('a plain single request would have lost rows (documents the bug)', async () => {
    const t = fakeTable(1500);
    const single = await t.page(0, 9999);
    expect(single.data).toHaveLength(1000);
  });

  it('stops and reports the error', async () => {
    const res = await fetchAll(async () => ({ data: null, error: { message: 'boom' } }));
    expect(res.error?.message).toBe('boom');
    expect(res.data).toEqual([]);
  });
});

describe('chunk', () => {
  it('splits into groups of the given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 3)).toEqual([]);
  });
});
