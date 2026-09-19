-- ==============================================================================
-- ROLLBACK: 20260918_rollback_init_schema.sql
-- Citizens Elementary School (CES) Discipleship Training Platform
-- ==============================================================================

DROP TABLE IF EXISTS ces_certificates CASCADE;
DROP TABLE IF EXISTS ces_attendance_records CASCADE;
DROP TABLE IF EXISTS ces_student_assessments CASCADE;
DROP TABLE IF EXISTS ces_quiz_questions CASCADE;
DROP TABLE IF EXISTS ces_quizzes CASCADE;
DROP TABLE IF EXISTS ces_students CASCADE;
DROP TABLE IF EXISTS ces_semesters CASCADE;
DROP TABLE IF EXISTS ces_staff_profiles CASCADE;

DROP FUNCTION IF EXISTS is_ces_staff();
