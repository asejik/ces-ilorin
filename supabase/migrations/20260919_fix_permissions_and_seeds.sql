-- ==============================================================================
-- MIGRATION: 20260919_fix_permissions_and_seeds.sql
-- Citizens Elementary School (CES) Discipleship Training Platform
-- Classification: PERMISSIONS & SEED DATA
-- Purpose: Grant schema, table, and sequence privileges to Supabase roles
--          and seed default active cohort semesters.
-- ==============================================================================

-- 1. Grant USAGE on public schema to standard Supabase roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Grant table privileges on all CES tables
GRANT ALL ON TABLE ces_staff_profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE ces_semesters TO anon, authenticated, service_role;
GRANT ALL ON TABLE ces_students TO anon, authenticated, service_role;
GRANT ALL ON TABLE ces_quizzes TO anon, authenticated, service_role;
GRANT ALL ON TABLE ces_quiz_questions TO anon, authenticated, service_role;
GRANT ALL ON TABLE ces_student_assessments TO anon, authenticated, service_role;
GRANT ALL ON TABLE ces_attendance_records TO anon, authenticated, service_role;
GRANT ALL ON TABLE ces_certificates TO anon, authenticated, service_role;

-- 3. Grant sequence & routine privileges
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Ensure future tables created in public schema inherit these privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 5. Seed default active semesters for 2026 cohorts if not already present
INSERT INTO ces_semesters (name, type, year, is_active, notes)
SELECT 'Regular Cohort — 2026', 'Regular', 2026, true, 'Default 2026 Regular Cohort'
WHERE NOT EXISTS (
  SELECT 1 FROM ces_semesters WHERE type = 'Regular' AND year = 2026
);

INSERT INTO ces_semesters (name, type, year, is_active, notes)
SELECT 'Sunday Cohort — 2026', 'Sunday Cohort', 2026, true, 'Default 2026 Sunday Cohort'
WHERE NOT EXISTS (
  SELECT 1 FROM ces_semesters WHERE type = 'Sunday Cohort' AND year = 2026
);
