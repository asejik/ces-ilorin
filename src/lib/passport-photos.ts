import type { SupabaseClient } from '@supabase/supabase-js';

/** Private bucket holding passport photos. Objects are never publicly readable. */
export const PASSPORT_BUCKET = 'ces-private';

/** Signed links expire quickly; staff pages request fresh ones on every load. */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Turns stored photo paths into short-lived signed URLs (staff pages only).
 * Returns a map keyed by the stored path; missing or failed paths are simply absent.
 */
export async function signPassportPaths(
  supabase: SupabaseClient,
  paths: Array<string | null | undefined>
): Promise<Map<string, string>> {
  const unique = Array.from(
    new Set(paths.filter((p): p is string => !!p && !p.startsWith('http')))
  );
  const result = new Map<string, string>();
  if (unique.length === 0) return result;

  const { data, error } = await supabase.storage
    .from(PASSPORT_BUCKET)
    .createSignedUrls(unique, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return result;

  for (const item of data) {
    if (item.path && item.signedUrl) result.set(item.path, item.signedUrl);
  }
  return result;
}
