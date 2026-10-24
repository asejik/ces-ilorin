-- Phase 4 step 3: the attendance table must not hold two rows for the same student, class and semester.
-- Staging was found WITHOUT the unique index the first migrations promised, so the "already checked in"
-- rule was only enforced by the app. Run STEP 1 first. If it returns rows, resolve them before STEP 2.

-- STEP 1: look for duplicates (expect no rows)
SELECT student_id, course_name, semester_id, count(*) AS copies
FROM ces_attendance_records
GROUP BY student_id, course_name, semester_id
HAVING count(*) > 1;

-- STEP 2: create the index (safe to run twice)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ces_attendance_student_course_semester
  ON ces_attendance_records (student_id, course_name, semester_id);

-- STEP 3: confirm (expect one row)
SELECT indexname FROM pg_indexes
WHERE tablename = 'ces_attendance_records' AND indexname = 'idx_ces_attendance_student_course_semester';
