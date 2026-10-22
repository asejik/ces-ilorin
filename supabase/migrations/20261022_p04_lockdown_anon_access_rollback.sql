-- ==============================================================================
-- ROLLBACK for 20261022_p04_lockdown_anon_access.sql
-- WARNING: this RE-OPENS the two CRITICAL holes (public can read quiz PINs and can
-- insert students/attendance directly). Use only to restore the previous behaviour
-- if the lockdown unexpectedly breaks a feature, then fix forward.
-- SCOPE: ces_* tables only (shared project).
-- ==============================================================================

BEGIN;

GRANT ALL ON TABLE
  ces_staff_profiles,
  ces_semesters,
  ces_students,
  ces_quizzes,
  ces_quiz_questions,
  ces_student_assessments,
  ces_attendance_records,
  ces_certificates
TO anon, authenticated, service_role;

CREATE POLICY "Public can view open quizzes" ON ces_quizzes
  FOR SELECT USING (is_open = true OR is_ces_staff());

CREATE POLICY "Anyone can register (insert student)" ON ces_students
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert attendance" ON ces_attendance_records
  FOR INSERT WITH CHECK (true);

COMMIT;
