// One-off (P04-04): move passport photos from the PUBLIC bucket ces-assets/passports
// to the PRIVATE bucket ces-private/passports/<uuid>, and store the path in passport_url.
// Dry run by default; pass --apply to change anything.  Needs .env.local (service role).
import fs from 'fs';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const apply = process.argv.includes('--apply');
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; })
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: rows, error } = await sb.from('ces_students').select('id, matric_no, passport_url').not('passport_url', 'is', null);
if (error) throw error;
console.log(`${apply ? 'APPLY' : 'DRY RUN'}: ${rows.length} students with a photo`);

for (const r of rows) {
  if (!r.passport_url.startsWith('http')) { console.log(`skip ${r.matric_no}: already a private path`); continue; }
  const m = r.passport_url.match(/\/ces-assets\/(passports\/[^?]+)/);
  if (!m) { console.log(`skip ${r.matric_no}: unrecognised URL`); continue; }
  const oldPath = decodeURIComponent(m[1]);
  const ext = oldPath.split('.').pop();
  const newPath = `passports/${randomUUID()}.${ext}`;
  console.log(`${r.matric_no}: ${oldPath} -> ${newPath}`);
  if (!apply) continue;
  const dl = await sb.storage.from('ces-assets').download(oldPath);
  if (dl.error) { console.log('  download failed:', dl.error.message); continue; }
  const buf = Buffer.from(await dl.data.arrayBuffer());
  const up = await sb.storage.from('ces-private').upload(newPath, buf, { contentType: dl.data.type || 'image/jpeg', upsert: false });
  if (up.error) { console.log('  upload failed:', up.error.message); continue; }
  const upd = await sb.from('ces_students').update({ passport_url: newPath }).eq('id', r.id);
  if (upd.error) { console.log('  row update failed:', upd.error.message); continue; }
  const del = await sb.storage.from('ces-assets').remove([oldPath]);
  console.log(del.error ? '  old copy NOT removed: ' + del.error.message : '  moved, public copy removed');
}

const left = await sb.storage.from('ces-assets').list('passports', { limit: 1000 });
console.log('objects still in public ces-assets/passports:', (left.data || []).filter((o) => o.id).length);
