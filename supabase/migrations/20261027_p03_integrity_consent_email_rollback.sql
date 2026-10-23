-- Rollback for 20261027_p03_integrity_consent_email.sql
-- WARNING: dropping the columns discards the consent and email-delivery records captured so far.
BEGIN;

DROP INDEX IF EXISTS uq_ces_students_email_semester;

ALTER TABLE ces_students
  DROP COLUMN IF EXISTS email_sent_at,
  DROP COLUMN IF EXISTS email_status,
  DROP COLUMN IF EXISTS consent_version,
  DROP COLUMN IF EXISTS consent_at;

-- Restore the original ON DELETE CASCADE behaviour on the three student_id foreign keys.
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
      'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (student_id) REFERENCES ces_students(id) ON DELETE CASCADE',
      r.tbl, r.conname
    );
  END LOOP;
END $$;

COMMIT;
-- NOTE: revert the app code too, or registration will try to write the dropped columns.
