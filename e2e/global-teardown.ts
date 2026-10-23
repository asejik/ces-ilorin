import fs from 'node:fs';
import { adminClient, E2E_TAG, readState, STATE_FILE } from './helpers';

/** Removes everything the run created and restores quiz / class-code settings. */
export default async function globalTeardown() {
  if (!fs.existsSync(STATE_FILE)) return;
  const sb = adminClient();
  const state = readState();

  // Students registered by the tests (children first: deletes are restricted by design).
  const { data: students } = await sb.from('ces_students').select('id, passport_url').like('email_address', `${E2E_TAG}%`);
  for (const s of students ?? []) {
    await sb.from('ces_student_assessments').delete().eq('student_id', s.id);
    await sb.from('ces_attendance_records').delete().eq('student_id', s.id);
    await sb.from('ces_certificates').delete().eq('student_id', s.id);
    if (s.passport_url) await sb.storage.from('ces-private').remove([s.passport_url]);
    await sb.from('ces_students').delete().eq('id', s.id);
  }

  for (const q of state.restore?.quizzes ?? []) {
    await sb.from('ces_quizzes').update({ is_open: q.is_open, session_pin: q.session_pin }).eq('id', q.id);
  }
  for (const c of state.restore?.classCodes ?? []) {
    await sb.from('ces_class_codes').update({ is_open: c.is_open }).eq('id', c.id);
  }

  for (const u of [state.admin, state.teacher]) {
    await sb.from('ces_staff_profiles').delete().eq('id', u.id);
    await sb.auth.admin.deleteUser(u.id);
  }
  await sb.from('ces_rate_limits').delete().neq('key', '');

  fs.unlinkSync(STATE_FILE);
}
