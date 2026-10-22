import { headers } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Best-effort client IP (Vercel sets x-forwarded-for). Falls back to a shared bucket. */
export function getClientIp(): string {
  try {
    const h = headers();
    const forwarded = h.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return h.get('x-real-ip')?.trim() || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Records one attempt for `key` and returns true while within `max` attempts per window.
 * If the limiter itself fails we allow the request (and log) so a database hiccup
 * cannot lock students out of class.
 */
export async function withinRateLimit(
  supabase: SupabaseClient,
  key: string,
  max: number,
  windowSeconds: number
): Promise<boolean> {
  const { data, error } = await supabase.rpc('ces_rate_limit_hit', {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error || typeof data !== 'boolean') {
    console.error('[RateLimit] limiter unavailable, allowing request:', error?.message);
    return true;
  }
  return data;
}

export const TOO_MANY_ATTEMPTS =
  'Too many attempts. Please wait a few minutes and try again.';
