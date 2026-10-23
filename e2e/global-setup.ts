import { adminClient, E2E_QUIZ_PIN, E2E_TAG, newPassword, writeState, type E2EState } from './helpers';

/**
 * Creates a temporary admin and teacher in the STAGING project, opens one quiz with a known PIN
 * and one attendance class code, and remembers the original settings for teardown.
 */
export default async function globalSetup() {
  const sb = adminClient();
  const runId = Date.now().toString(36);

  const mk = async (role: 'ces_admin' | 'ces_teacher') => {
    const email = `${E2E_TAG}${role}-${runId}@example.com`;
    const password = newPassword();
    const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) throw new Error(`could not create ${role}: ${error?.message}`);
    const p = await sb.from('ces_staff_profiles').insert({ id: data.user.id, email, full_name: `E2E ${role}`, role });
    if (p.error) throw new Error(`could not create staff profile: ${p.error.message}`);
    return { id: data.user.id, email, password };
  };

  const state: E2EState = { runId, admin: await mk('ces_admin'), teacher: await mk('ces_teacher') };

  // Make sure the active Regular semester has its quizzes and class codes, then open one of each.
  const { data: sem } = await sb.from('ces_semesters').select('id').eq('type', 'Regular').eq('is_active', true).single();
  if (!sem) throw new Error('No active Regular semester in the staging project.');

  const { data: quizzes } = await sb.from('ces_quizzes').select('id, course_code, is_open, session_pin').eq('semester_id', sem.id);
  const salvation = quizzes?.find((q) => q.course_code === 'salvation');
  if (!salvation) throw new Error('Quiz "salvation" not found for the active Regular semester. Open /assess once to create quizzes, and add questions.');
  const { count } = await sb.from('ces_quiz_questions').select('id', { count: 'exact', head: true }).eq('quiz_id', salvation.id);
  if (!count) throw new Error('The "salvation" quiz has no questions in the staging project; add some before running the quiz journey.');

  const { data: codes } = await sb.from('ces_class_codes').select('id, course_name, is_open').eq('semester_id', sem.id);
  const code = codes?.find((c) => c.course_name === 'Doctrine of Salvation');
  if (!code) throw new Error('No class code rows yet. Open /admin/attendance once as staff to create them.');

  state.restore = {
    quizzes: [{ id: salvation.id, is_open: salvation.is_open, session_pin: salvation.session_pin }],
    classCodes: [{ id: code.id, is_open: code.is_open }],
  };
  await sb.from('ces_quizzes').update({ is_open: true, session_pin: E2E_QUIZ_PIN }).eq('id', salvation.id);
  await sb.from('ces_class_codes').update({ is_open: true }).eq('id', code.id);

  writeState(state);
}
