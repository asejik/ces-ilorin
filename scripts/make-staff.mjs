#!/usr/bin/env node
/**
 * Gives an EXISTING Supabase Auth user a CES staff role.
 *   1. In the Supabase dashboard: Authentication > Users > Add user (email + password).
 *   2. node scripts/make-staff.mjs --env private/env/production.env you@example.org super_admin "Full Name"
 *
 * Roles: super_admin | ces_admin | ces_teacher. Prints no secrets.
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnv, maskedHost } from './lib/load-env.mjs';

const { env } = loadEnv();
const args = process.argv.slice(2).filter((a, i, all) => a !== '--env' && all[i - 1] !== '--env');
const [email, role = 'ces_teacher', fullName = 'CES Staff'] = args;
if (!email || !['super_admin', 'ces_admin', 'ces_teacher'].includes(role)) {
  console.error('Usage: node scripts/make-staff.mjs [--env file] <email> <super_admin|ces_admin|ces_teacher> ["Full Name"]');
  process.exit(2);
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
console.log('Project', maskedHost(env.NEXT_PUBLIC_SUPABASE_URL));

let found = null;
for (let page = 1; !found && page <= 20; page++) {
  const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 100 });
  if (error) { console.error('Could not list users:', error.message); process.exit(1); }
  found = data.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
  if (data.users.length < 100) break;
}
if (!found) {
  console.error(`No Auth user with that email. Create it first in the dashboard (Authentication > Users > Add user).`);
  process.exit(1);
}
const { error } = await sb.from('ces_staff_profiles').upsert({ id: found.id, email: found.email, full_name: fullName, role }, { onConflict: 'id' });
if (error) { console.error('Failed:', error.message); process.exit(1); }
console.log(`OK: ${found.email} is now ${role}.`);
