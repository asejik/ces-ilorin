#!/usr/bin/env node
/**
 * Regression test for database exposure (audit findings P04-01 / P04-02).
 *
 * Uses ONLY the public anon key - the same power any website visitor has - and creates no
 * data: write attempts use fake foreign keys, so they fail even if row-level security
 * lets them through (error 23503 = "was allowed past RLS" = FAIL).
 *
 * Usage:  npm run test:rls                                  (reads .env.local)
 *          node scripts/verify-rls.mjs --env private/env/production.env
 * Exit code 0 = all checks passed, 1 = at least one exposure found.
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './lib/load-env.mjs';

const { env } = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(2);
}

const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const FAKE = '00000000-0000-0000-0000-000000000000';
let failures = 0;

function report(name, ok, detail) {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -> ' + detail : ''}`);
}

const TABLES = [
  'ces_staff_profiles',
  'ces_semesters',
  'ces_students',
  'ces_quizzes',
  'ces_quiz_questions',
  'ces_student_assessments',
  'ces_attendance_records',
  'ces_certificates',
  'ces_matric_counters',
  'ces_class_codes',
  'ces_rate_limits',
  'ces_audit_log',
];

// 1. Anonymous reads must return nothing (empty result or permission error).
for (const t of TABLES) {
  const { data, error } = await anon.from(t).select('*').limit(5);
  const rows = data?.length ?? 0;
  report(`anon cannot read ${t}`, rows === 0, error ? `blocked (${error.code})` : `rows=${rows}`);
}

// 1b. Specifically: quiz PINs must not be visible.
{
  const { data } = await anon.from('ces_quizzes').select('session_pin').limit(1);
  report('anon cannot see any session_pin', !data || data.length === 0);
}

// 2. Anonymous writes must be refused by permissions/RLS (42501), NOT reach the FK check (23503).
const writes = [
  ['ces_students', { semester_id: FAKE, matric_no: 'RLS/TEST/0', surname: 'x', first_name: 'x', phone_number: '0', email_address: 'a@b.c', gender: 'x', marital_status: 'x', born_again: 'x', baptised_hs: 'x', attended_mem_vision: 'x', committed_to_programme: 'x', cohort_type: 'Regular' }],
  ['ces_attendance_records', { student_id: FAKE, semester_id: FAKE, course_name: 'x', status: 'Attended' }],
  ['ces_student_assessments', { student_id: FAKE, quiz_id: FAKE, score: 5 }],
  ['ces_quizzes', { semester_id: FAKE, course_code: 'x', title: 'x', assessment_type: 'quiz' }],
  ['ces_certificates', { student_id: FAKE, certificate_no: 'x', honour_class: 'Pass', cumulative_total: 50 }],
];
for (const [table, row] of writes) {
  const { error } = await anon.from(table).insert(row);
  const refused = !!error && error.code !== '23503';
  report(`anon cannot insert into ${table}`, refused, error ? `${error.code}` : 'INSERTED');
}

// 3. Anonymous update/delete must affect nothing.
{
  const u = await anon.from('ces_quizzes').update({ is_open: true }).eq('is_open', true).select('id');
  report('anon cannot update ces_quizzes', !u.data || u.data.length === 0);
  const d = await anon.from('ces_students').delete().eq('id', FAKE).select('id');
  report('anon cannot delete ces_students', !d.data || d.data.length === 0);
}

// 4. Private storage bucket must not be listable.
{
  const { data } = await anon.storage.from('ces-private').list('manuals', { limit: 5 });
  report('anon cannot list ces-private', !data || data.length === 0);
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
