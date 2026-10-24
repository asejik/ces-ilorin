#!/usr/bin/env node
/**
 * Backs up every CES table (and optionally the private files) to a local folder.
 *   node scripts/backup.mjs                                   -> staging (.env.local)
 *   node scripts/backup.mjs --env private/env/production.env  -> production
 *   add --with-files to also download passport photos and the manual from the ces-private bucket
 *   node scripts/backup.mjs --verify private/backups/<folder> -> re-check a finished backup
 *
 * Output goes to private/backups/ (git-ignored). It contains personal data and answer keys:
 * keep it on an encrypted drive and never commit or email it. Prints no secrets.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { loadEnv, maskedHost } from './lib/load-env.mjs';

const TABLES = [
  'ces_staff_profiles',
  'ces_semesters',
  'ces_students',
  'ces_quizzes',
  'ces_quiz_questions',
  'ces_student_assessments',
  'ces_attendance_records',
  'ces_certificates',
  'ces_audit_log',
  'ces_class_codes',
  'ces_matric_counters',
];
const PAGE = 1000;
const FILE_FOLDERS = ['passports', 'manuals'];
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

function verify(dir) {
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  let bad = 0;
  for (const f of manifest.files) {
    const p = path.join(dir, f.path);
    const ok = fs.existsSync(p) && sha256(fs.readFileSync(p)) === f.sha256;
    if (!ok) { bad++; console.error(`MISMATCH or missing: ${f.path}`); }
  }
  for (const t of manifest.tables) {
    const rows = JSON.parse(fs.readFileSync(path.join(dir, 'tables', `${t.name}.json`), 'utf8'));
    if (rows.length !== t.rows) { bad++; console.error(`Row count differs for ${t.name}: ${rows.length} vs ${t.rows}`); }
  }
  console.log(bad === 0 ? `Backup OK: ${manifest.files.length} files, ${manifest.tables.length} tables.` : `Backup has ${bad} problem(s).`);
  process.exit(bad === 0 ? 0 : 1);
}

const vi = process.argv.indexOf('--verify');
if (vi >= 0) verify(process.argv[vi + 1]);

const { env } = loadEnv();
const withFiles = process.argv.includes('--with-files');
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const host = maskedHost(env.NEXT_PUBLIC_SUPABASE_URL).replace(/[^a-z0-9]/gi, '_');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const dir = path.join('private', 'backups', `${host}_${stamp}`);
fs.mkdirSync(path.join(dir, 'tables'), { recursive: true });
console.log('Project', maskedHost(env.NEXT_PUBLIC_SUPABASE_URL), '->', dir);

const manifest = { createdAt: new Date().toISOString(), project: maskedHost(env.NEXT_PUBLIC_SUPABASE_URL), tables: [], files: [] };
let failed = false;

for (const name of TABLES) {
  const rows = [];
  let err = null;
  for (let from = 0; ; from += PAGE) {
    // order by the first column so paging never skips or repeats rows
    const { data, error } = await sb.from(name).select('*').order('id', { ascending: true }).range(from, from + PAGE - 1);
    if (error) { err = error; break; }
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  if (err && /column .* does not exist/i.test(err.message)) {
    // tables without an id column (for example the matric counters): read without ordering
    err = null;
    rows.length = 0;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await sb.from(name).select('*').range(from, from + PAGE - 1);
      if (error) { err = error; break; }
      rows.push(...data);
      if (data.length < PAGE) break;
    }
  }
  if (err) { console.error(`FAILED ${name}: ${err.message}`); failed = true; continue; }

  const { count, error: cErr } = await sb.from(name).select('*', { count: 'exact', head: true });
  if (!cErr && count !== rows.length) { console.error(`FAILED ${name}: read ${rows.length} rows but the table has ${count}`); failed = true; continue; }

  const body = JSON.stringify(rows);
  const rel = path.join('tables', `${name}.json`);
  fs.writeFileSync(path.join(dir, rel), body);
  manifest.tables.push({ name, rows: rows.length });
  manifest.files.push({ path: rel, sha256: sha256(Buffer.from(body)) });
  console.log(`  ${name}: ${rows.length} rows`);
}

if (withFiles) {
  for (const folder of FILE_FOLDERS) {
    const { data: items, error } = await sb.storage.from('ces-private').list(folder, { limit: 10000 });
    if (error) { console.error(`FAILED listing ${folder}: ${error.message}`); failed = true; continue; }
    let n = 0;
    for (const it of items.filter((i) => i.id)) {
      const { data: blob, error: dErr } = await sb.storage.from('ces-private').download(`${folder}/${it.name}`);
      if (dErr || !blob) { console.error(`FAILED download ${folder}/${it.name}`); failed = true; continue; }
      const buf = Buffer.from(await blob.arrayBuffer());
      const rel = path.join('files', folder, it.name);
      fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
      fs.writeFileSync(path.join(dir, rel), buf);
      manifest.files.push({ path: rel, sha256: sha256(buf) });
      n++;
    }
    console.log(`  files/${folder}: ${n} file(s)`);
  }
}

fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
if (failed) {
  console.error('Backup INCOMPLETE. Do not rely on it. Fix the errors above and run again.');
  process.exit(1);
}
console.log(`Backup complete. Check it with: node scripts/backup.mjs --verify ${dir}`);
