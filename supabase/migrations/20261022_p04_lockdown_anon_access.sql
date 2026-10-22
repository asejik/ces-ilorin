-- ==============================================================================
-- MIGRATION: 20261022_p04_lockdown_anon_access.sql
-- Fixes audit findings P04-01 (quiz PINs readable) and P04-02 (anonymous writes).
--
-- CLASSIFICATION : PERMISSIONS CHANGE. No rows are changed or deleted.
--                  Reversible with 20261022_p04_lockdown_anon_access_rollback.sql
-- SCOPE          : ONLY the eight ces_* tables. This Supabase project is SHARED with
--                  another church's application, so this file deliberately does NOT
--                  touch other tables, schema-wide grants or ALTER DEFAULT PRIVILEGES.
-- WHY IT IS SAFE : the CES app reads/writes ces_* data only through server code that
--                  uses the service_role key (which bypasses RLS and keeps its grants).
--                  The browser/cookie clients are used only for staff sign-in.
-- ==============================================================================

BEGIN;

-- P04-01: the public could read ces_quizzes.session_pin (policy allowed any open quiz).
-- The existing "Staff can manage quizzes" (FOR ALL ... is_ces_staff()) policy remains.
DROP POLICY IF EXISTS "Public can view open quizzes" ON ces_quizzes;

-- P04-02: anyone could insert students / attendance directly, bypassing server validation.
DROP POLICY IF EXISTS "Anyone can register (insert student)" ON ces_students;
DROP POLICY IF EXISTS "Anyone can insert attendance" ON ces_attendance_records;

-- Defence in depth: remove the blanket GRANT ALL that earlier migrations gave to the
-- public-facing roles. With no privileges, these roles cannot reach the tables even if
-- a permissive policy is added by mistake later.
REVOKE ALL ON TABLE
  ces_staff_profiles,
  ces_semesters,
  ces_students,
  ces_quizzes,
  ces_quiz_questions,
  ces_student_assessments,
  ces_attendance_records,
  ces_certificates
FROM anon, authenticated;

-- The server (service_role) keeps full access (explicit, so nothing depends on defaults).
GRANT ALL ON TABLE
  ces_staff_profiles,
  ces_semesters,
  ces_students,
  ces_quizzes,
  ces_quiz_questions,
  ces_student_assessments,
  ces_attendance_records,
  ces_certificates
TO service_role;

COMMIT;
