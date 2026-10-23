#!/usr/bin/env node
/**
 * One-time setup of a fresh CES Supabase project AFTER running ces_fresh_install.sql:
 *   1. checks that the schema is installed and the server-only functions work
 *   2. creates the private storage bucket `ces-private`
 *   3. copies the course manual from another project's `ces-private` bucket (optional)
 *
 *   node scripts/setup-project.mjs --env private/env/production.env [--copy-manual-from .env.local]
 *
 * Safe to run twice. Prints no secrets.
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { loadEnv, maskedHost } from './lib/load-env.mjs';

const { env, file } = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in', file);
  process.exit(2);
}
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
console.log(`Project ${maskedHost(url)} (from ${file})\n`);

let problems = 0;
const ok = (m) => console.log('  OK   ', m);
const bad = (m) => { problems++; console.log('  FAIL ', m); };

// 1. schema present
const tables = [
  'ces_staff_profiles', 'ces_semesters', 'ces_students', 'ces_quizzes', 'ces_quiz_questions',
  'ces_student_assessments', 'ces_attendance_records', 'ces_certificates', 'ces_matric_counters',
  'ces_class_codes', 'ces_rate_limits', 'ces_audit_log',
];
for (const t of tables) {
  const { error } = await sb.from(t).select('*', { count: 'exact', head: true });
  error ? bad(`table ${t}: ${error.code} ${error.message}`) : ok(`table ${t}`);
}

// 1b. functions (use an obviously fake year so no real counter is touched, then remove it)
const seq = await sb.rpc('ces_next_matric_seq', { p_year: 2099, p_month: 12 });
typeof seq.data === 'number' ? ok('function ces_next_matric_seq') : bad(`ces_next_matric_seq: ${seq.error?.message}`);
await sb.from('ces_matric_counters').delete().eq('counter_key', '99L12');
const rl = await sb.rpc('ces_rate_limit_hit', { p_key: 'setup:test', p_max: 5, p_window_seconds: 60 });
rl.data === true ? ok('function ces_rate_limit_hit') : bad(`ces_rate_limit_hit: ${rl.error?.message}`);
await sb.from('ces_rate_limits').delete().eq('key', 'setup:test');

const { data: sems } = await sb.from('ces_semesters').select('name,type,is_active');
console.log('  info  semesters:', JSON.stringify(sems));

// 2. bucket
const { data: buckets } = await sb.storage.listBuckets();
if (!buckets?.some((b) => b.name === 'ces-private')) {
  const { error } = await sb.storage.createBucket('ces-private', { public: false });
  error ? bad(`create bucket: ${error.message}`) : ok('created private bucket ces-private');
} else ok('bucket ces-private already exists');
const info = (await sb.storage.listBuckets()).data?.find((b) => b.name === 'ces-private');
info?.public === false ? ok('ces-private is PRIVATE') : bad('ces-private is not private!');

// 3. manual
const flag = process.argv.indexOf('--copy-manual-from');
if (flag >= 0) {
  const src = loadEnv(['', '', '--env', process.argv[flag + 1]]).env;
  const from = createClient(src.NEXT_PUBLIC_SUPABASE_URL, src.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const dl = await from.storage.from('ces-private').download('manuals/course-manual.pdf');
  if (dl.error) bad(`download manual from source project: ${dl.error.message}`);
  else {
    const buf = Buffer.from(await dl.data.arrayBuffer());
    const up = await sb.storage.from('ces-private').upload('manuals/course-manual.pdf', buf, { contentType: 'application/pdf', upsert: true });
    up.error ? bad(`upload manual: ${up.error.message}`) : ok(`copied course manual (${buf.length} bytes)`);
  }
}

console.log(problems === 0 ? '\nSETUP OK' : `\n${problems} problem(s) found`);
process.exit(problems === 0 ? 0 : 1);
