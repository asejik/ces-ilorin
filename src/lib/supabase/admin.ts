import { createClient } from '@supabase/supabase-js';

/**
 * Administrative Supabase Client (Service Role)
 *
 * CRITICAL SECURITY ARCHITECTURE RULE:
 * This client uses the SUPABASE_SERVICE_ROLE_KEY and bypasses Row Level Security.
 * It must NEVER be imported or executed in client components, browser bundles,
 * or exposed to public API endpoints without authentication checks.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('[Supabase Admin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL environment variable.');
  }

  if (!serviceRoleKey) {
    throw new Error('[Supabase Admin] Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Administrative actions require service role authority.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
