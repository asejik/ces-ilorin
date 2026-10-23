-- ==============================================================================
-- MIGRATION: 20261027_p03_integrity_consent_email.sql
-- Fixes audit findings P03-12 (cascading deletes), P03-10 (consent not stored)
-- and P03-07 (no unique email, no record of email delivery).
--
-- CLASSIFICATION : STRUCTURE CHANGE. Adds columns and a unique index, and changes three
--                  foreign keys. No existing rows are changed or deleted.
--                  Reversible with 20261027_p03_integrity_consent_email_rollback.sql
-- SCOPE          : CES tables only (project is SHARED with the sermons app: untouched).
-- IF IT FAILS    : one transaction, so a failure changes nothing.
-- ==============================================================================

BEGIN;

-- 0. Safety check: refuse to continue if two live students share an email within one semester.
--    (A returning student in a LATER semester may reuse their email; that stays allowed.)
DO $$
DECLARE
  dup_count INT;
BEGIN
  SELECT count(*) INTO dup_count FROM (
    SELECT lower(trim(email_address)), semester_id
    FROM ces_students
    WHERE is_deleted = false
    GROUP BY 1, 2
    HAVING count(*) > 1
  ) d;
  IF dup_count > 0 THEN
    RAISE EXCEPTION 'Aborting: % email address(es) are used by more than one student in the same semester. Resolve them first.', dup_count;
  END IF;
END $$;

-- 1. P03-12: academic records must never vanish because a student row is deleted.
--    Replace ON DELETE CASCADE with ON DELETE RESTRICT on the three student_id foreign keys
--    (same constraint names, looked up dynamically). Use the existing is_deleted soft delete
--    / status instead of removing students.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conrelid::regclass AS tbl, c.conname
    FROM pg_constraint c
    WHERE c.contype = 'f'
      AND c.confrelid = 'ces_students'::regclass
      AND c.conrelid IN (
        'ces_student_assessments'::regclass,
        'ces_attendance_records'::regclass,
        'ces_certificates'::regclass
      )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
    EXECUTE format(
      'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (student_id) REFERENCES ces_students(id) ON DELETE RESTRICT',
      r.tbl, r.conname
    );
  END LOOP;
END $$;

-- 2. P03-10: remember when each student agreed to the data-protection notice, and which version.
--    Existing students stay NULL (consent was given before it was recorded).
ALTER TABLE ces_students
  ADD COLUMN IF NOT EXISTS consent_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_version TEXT;

-- 3. P03-07: record whether the welcome email (matric number + manual) went out.
--    Existing students get 'unknown'; new registrations start as 'pending'.
ALTER TABLE ces_students
  ADD COLUMN IF NOT EXISTS email_status  TEXT NOT NULL DEFAULT 'unknown'
    CHECK (email_status IN ('unknown', 'pending', 'sent', 'failed', 'not_configured')),
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;
ALTER TABLE ces_students ALTER COLUMN email_status SET DEFAULT 'pending';

-- 4. P03-07: one registration per email address per semester (case-insensitive).
CREATE UNIQUE INDEX IF NOT EXISTS uq_ces_students_email_semester
  ON ces_students (lower(trim(email_address)), semester_id)
  WHERE is_deleted = false;

COMMIT;
