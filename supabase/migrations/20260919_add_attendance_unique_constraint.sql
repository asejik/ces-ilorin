-- ==============================================================================
-- MIGRATION: 20260919_add_attendance_unique_constraint.sql
-- Citizens Elementary School (CES) Discipleship Training Platform
-- Classification: IDEMPOTENCY / DATA INTEGRITY
-- ==============================================================================

-- 1. Create a composite unique index on ces_attendance_records
-- Guarantees atomic idempotency and eliminates race condition duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_ces_attendance_student_course_semester 
ON ces_attendance_records(student_id, course_name, semester_id);
