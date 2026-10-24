import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const DB_TIMEOUT_MS = 4000;

/** One tiny database read, so "ok" means the portal can really reach its data (not just that Next.js is up). */
async function databaseReachable(): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const query = supabase.from('ces_semesters').select('id', { head: true, count: 'exact' }).limit(1);
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('database check timed out')), DB_TIMEOUT_MS)
    );
    const { error } = await Promise.race([query, timeout]);
    if (error) {
      console.error('[Health] database check failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Health] database check failed:', err instanceof Error ? err.message : err);
    return false;
  }
}

export async function GET() {
  const database = await databaseReachable();
  // Details stay in the server log; the public answer only says whether things work.
  return NextResponse.json(
    {
      status: database ? 'ok' : 'degraded',
      service: 'ces-portal',
      database: database ? 'ok' : 'unreachable',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    },
    {
      status: database ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
