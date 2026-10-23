#!/usr/bin/env node
/**
 * Real load test for the stated requirement: 100 students entering a quiz room and submitting
 * answers at the same time, p95 < 1.5 s, zero errors.
 *
 * It talks to the app exactly like the browser does (Next.js Server Action POSTs), using a
 * TEMPORARY semester with 100 temporary students in the STAGING Supabase project, and removes
 * everything afterwards. It refuses to run against the production project.
 *
 *   npm run build && npm run start      (in another terminal; action ids come from .next/)
 *   npm run test:load:quiz              (defaults: http://localhost:3000, 100 students)
 *   node load-test/quiz-load-test.mjs http://localhost:3000 --shared-ip
 *
 * --shared-ip  every student appears to come from ONE address (a church wifi network), which
 *              proves the per-address rate limits do not block a whole classroom.
 * Env: CONCURRENCY (default 100), P95_LIMIT_MS (default 1500), RAMP_SECONDS (default 0 = all at once;
 *      10 = students tap "Verify" at random moments over 10 s, like a real classroom)
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { createClient } from '@supabase/supabase-js';
import { loadEnv, maskedHost } from '../scripts/lib/load-env.mjs';

const target = (process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : process.env.LOAD_TEST_TARGET || 'http://localhost:3000').replace(/\/$/, '');
const sharedIp = process.argv.includes('--shared-ip');
const N = parseInt(process.env.CONCURRENCY || '100', 10);
const P95_LIMIT = parseInt(process.env.P95_LIMIT_MS || '1500', 10);
// Seconds over which students start (0 = everyone at the same instant, the harshest case).
const RAMP = parseFloat(process.env.RAMP_SECONDS || '0');
const PIN = 'LOADTS';

const { env } = loadEnv(['', '', '--env', '.env.local']);
const prod = fs.existsSync('private/env/production.env') ? loadEnv(['', '', '--env', 'private/env/production.env']).env : null;
if (prod && new URL(prod.NEXT_PUBLIC_SUPABASE_URL).host === new URL(env.NEXT_PUBLIC_SUPABASE_URL).host) {
  console.error('Refusing to run: .env.local points at the PRODUCTION project.');
  process.exit(2);
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// --- Server Action ids from the local build ---------------------------------------------------
const manifestPath = '.next/server/server-reference-manifest.json';
if (!fs.existsSync(manifestPath)) {
  console.error('No build found. Run `npm run build` and `npm run start` first.');
  process.exit(2);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).node ?? {};
const actionId = (name) => Object.entries(manifest).find(([, v]) => (v.exportedName || v.name) === name)?.[0];
const VERIFY = actionId('verifyAssessmentAccessAction');
const SUBMIT = actionId('submitAssessmentAction');
if (!VERIFY || !SUBMIT) {
  console.error('Could not find the quiz Server Actions in the build manifest.');
  process.exit(2);
}

async function callAction(path, id, arg, ip) {
  const t0 = performance.now();
  let status = 0;
  try {
    const res = await fetch(`${target}${path}`, {
      method: 'POST',
      headers: {
        'Next-Action': id,
        'Content-Type': 'text/plain;charset=UTF-8',
        Accept: 'text/x-component',
        'x-forwarded-for': ip,
      },
      body: JSON.stringify([arg]),
    });
    status = res.status;
    const text = await res.text();
    const line = text.split('\n').find((l) => l.startsWith('1:'));
    const body = line ? JSON.parse(line.slice(2)) : null;
    return { ms: performance.now() - t0, status, body };
  } catch (err) {
    return { ms: performance.now() - t0, status, body: null, error: String(err) };
  }
}

const pct = (arr, p) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.max(0, Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1))];
};

// --- Seed -------------------------------------------------------------------------------------
const runId = crypto.randomBytes(3).toString('hex').toUpperCase();
let semId = null;
async function seed() {
  const { data: sem, error: se } = await sb.from('ces_semesters').insert({ name: `ZZ Load Test ${runId}`, type: 'Regular', year: 2099, is_active: false }).select('id').single();
  if (se) throw se;
  semId = sem.id;
  const { data: quiz, error: qe } = await sb.from('ces_quizzes').insert({ semester_id: semId, course_code: 'salvation', title: 'Load Test Quiz', assessment_type: 'quiz', max_score: 5, session_pin: PIN, is_open: true }).select('id').single();
  if (qe) throw qe;
  const { error: qq } = await sb.from('ces_quiz_questions').insert(
    Array.from({ length: 5 }, (_, i) => ({ quiz_id: quiz.id, question_text: `Question ${i + 1}?`, options: ['A', 'B', 'C', 'D'], correct_option_index: i % 4, marks: 1, sort_order: i }))
  );
  if (qq) throw qq;
  const students = Array.from({ length: N }, (_, i) => ({
    semester_id: semId, matric_no: `CES/ILR/99Z${runId}${String(i).padStart(3, '0')}`, surname: 'Loadtest', first_name: `S${i}`,
    phone_number: '0800', email_address: `load-${runId}-${i}@example.com`, gender: 'Male', marital_status: 'Single',
    born_again: 'Yes', baptised_hs: 'Yes', attended_mem_vision: 'Yes', committed_to_programme: 'Yes', cohort_type: 'Regular',
  }));
  const { error: ste } = await sb.from('ces_students').insert(students);
  if (ste) throw ste;
  return { students, quizId: quiz.id };
}

async function cleanup() {
  if (!semId) return;
  const { data: studs } = await sb.from('ces_students').select('id').eq('semester_id', semId);
  const { data: quizzes } = await sb.from('ces_quizzes').select('id').eq('semester_id', semId);
  const qids = (quizzes ?? []).map((q) => q.id);
  if (qids.length) {
    await sb.from('ces_student_assessments').delete().in('quiz_id', qids);
  }
  await sb.from('ces_students').delete().eq('semester_id', semId);
  await sb.from('ces_quizzes').delete().eq('semester_id', semId); // questions cascade
  await sb.from('ces_semesters').delete().eq('id', semId);
  await sb.from('ces_rate_limits').delete().neq('key', '');
  console.log(`cleanup done (${studs?.length ?? 0} temporary students removed)`);
}

// --- Run --------------------------------------------------------------------------------------
console.log('='.repeat(70));
console.log(` CES quiz load test: ${N} students at once${sharedIp ? ' (ALL FROM ONE SHARED ADDRESS)' : ''}`);
console.log(` App: ${target} | Database (staging): ${maskedHost(env.NEXT_PUBLIC_SUPABASE_URL)} | p95 limit: ${P95_LIMIT} ms`);
console.log('='.repeat(70));

let exitCode = 0;
try {
  const { students } = await seed();
  console.log(`seeded ${N} temporary students in a throw-away semester`);

  const verifyMs = [], submitMs = [], totalMs = [];
  const failures = [];
  let recorded = 0;

  const t0 = performance.now();
  await Promise.all(students.map(async (s, i) => {
    const ip = sharedIp ? '10.20.30.40' : `10.${(i >> 8) & 255}.${i & 255}.7`;
    await new Promise((r) => setTimeout(r, RAMP > 0 ? Math.random() * RAMP * 1000 : 0));
    const start = performance.now();
    const v = await callAction('/assess', VERIFY, { matricNo: s.matric_no, courseCode: 'salvation', sessionPin: PIN, cohortType: 'Regular' }, ip);
    verifyMs.push(v.ms);
    if (!v.body?.success) { failures.push(`verify #${i}: ${v.error ?? v.body?.error ?? 'HTTP ' + v.status}`); return; }
    // think time like a person reading the question (0.2-1.0 s), then answer every question
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 800));
    const answers = Object.fromEntries(v.body.questions.map((q) => [q.id, Math.floor(Math.random() * 4)]));
    const sub = await callAction('/assess', SUBMIT, { matricNo: s.matric_no, quizId: v.body.quiz.id, answers, sessionPin: PIN }, ip);
    submitMs.push(sub.ms);
    if (!sub.body?.success) { failures.push(`submit #${i}: ${sub.error ?? sub.body?.error ?? 'HTTP ' + sub.status}`); return; }
    recorded++;
    totalMs.push(performance.now() - start);
  }));
  const wall = (performance.now() - t0) / 1000;

  // Truth check in the database, not just HTTP replies
  const { count: rows } = await sb.from('ces_student_assessments').select('id', { count: 'exact', head: true }).in('student_id', (await sb.from('ces_students').select('id').eq('semester_id', semId)).data.map((r) => r.id));

  const row = (label, a) => console.log(`${label.padEnd(18)} n=${String(a.length).padStart(3)}  p50=${pct(a, 50).toFixed(0).padStart(5)} ms  p95=${pct(a, 95).toFixed(0).padStart(5)} ms  p99=${pct(a, 99).toFixed(0).padStart(5)} ms  max=${Math.max(0, ...a).toFixed(0).padStart(5)} ms`);
  console.log('');
  row('enter room (verify)', verifyMs);
  row('submit answers', submitMs);
  row('whole journey', totalMs);
  console.log(`\nwall time ${wall.toFixed(1)} s | recorded by server: ${recorded}/${N} | rows in database: ${rows}/${N} | failures: ${failures.length}`);
  failures.slice(0, 8).forEach((f) => console.log('  ' + f));

  const p95Submit = pct(submitMs, 95);
  const p95Verify = pct(verifyMs, 95);
  const ok = failures.length === 0 && rows === N && p95Submit < P95_LIMIT && p95Verify < P95_LIMIT;
  console.log(ok ? `\nPASS (p95 submit ${p95Submit.toFixed(0)} ms, enter ${p95Verify.toFixed(0)} ms < ${P95_LIMIT} ms, no errors)` : `\nFAIL (see numbers above)`);
  exitCode = ok ? 0 : 1;
} catch (err) {
  console.error('load test aborted:', err?.message ?? err);
  exitCode = 1;
} finally {
  await cleanup();
}
process.exit(exitCode);
