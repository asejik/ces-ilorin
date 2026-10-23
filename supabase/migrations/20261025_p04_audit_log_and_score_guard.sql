-- ==============================================================================
-- MIGRATION: 20261025_p04_audit_log_and_score_guard.sql
-- Fixes audit findings P04-10 (no audit trail, scores could exceed the quiz maximum)
-- and P04-16 (is_ces_staff() had no fixed search_path).
--
-- CLASSIFICATION : ADDITIVE + one safety check. No existing rows are changed or deleted.
--                  Reversible with 20261025_p04_audit_log_and_score_guard_rollback.sql
-- SCOPE          : CES objects only (project is SHARED with the sermons app: untouched).
-- IF IT FAILS    : the whole script runs in one transaction, so a failure changes nothing.
-- ==============================================================================

BEGIN;

-- 0. Safety check: refuse to continue if any stored score already exceeds its quiz maximum.
--    (If this fires, nothing has been changed. Fix or review those rows first.)
DO $$
DECLARE
  bad_count INT;
BEGIN
  SELECT count(*) INTO bad_count
  FROM ces_student_assessments a
  JOIN ces_quizzes q ON q.id = a.quiz_id
  WHERE a.score > q.max_score;
  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Aborting: % assessment row(s) have a score above the quiz maximum. Review them before applying this migration.', bad_count;
  END IF;
END $$;

-- 1. Append-only audit log of staff changes to scores and attendance.
--    No foreign keys on purpose: history must survive if a student or staff member is later removed.
CREATE TABLE IF NOT EXISTS ces_audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id     UUID,
  actor_email  TEXT,
  action       TEXT NOT NULL,          -- e.g. 'score_override', 'attendance_override'
  student_id   UUID,
  target_table TEXT NOT NULL,
  target_id    UUID,
  old_value    JSONB,
  new_value    JSONB,
  reason       TEXT
);

CREATE INDEX IF NOT EXISTS idx_ces_audit_log_created ON ces_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ces_audit_log_student ON ces_audit_log(student_id);

ALTER TABLE ces_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE ces_audit_log FROM anon, authenticated;
-- The server may add and read entries, never change or delete them.
GRANT SELECT, INSERT ON TABLE ces_audit_log TO service_role;

-- Even a role that holds UPDATE/DELETE rights cannot rewrite history through normal SQL.
CREATE OR REPLACE FUNCTION ces_audit_log_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'ces_audit_log is append-only';
END;
$$;

DROP TRIGGER IF EXISTS trg_ces_audit_log_no_change ON ces_audit_log;
CREATE TRIGGER trg_ces_audit_log_no_change
  BEFORE UPDATE OR DELETE ON ces_audit_log
  FOR EACH ROW EXECUTE FUNCTION ces_audit_log_immutable();

DROP TRIGGER IF EXISTS trg_ces_audit_log_no_truncate ON ces_audit_log;
CREATE TRIGGER trg_ces_audit_log_no_truncate
  BEFORE TRUNCATE ON ces_audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION ces_audit_log_immutable();

-- 2. A score can never exceed the maximum of its quiz, whatever the application sends.
CREATE OR REPLACE FUNCTION ces_enforce_score_range()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_max NUMERIC;
BEGIN
  SELECT max_score INTO v_max FROM ces_quizzes WHERE id = NEW.quiz_id;
  IF v_max IS NULL THEN
    RAISE EXCEPTION 'Quiz % not found', NEW.quiz_id;
  END IF;
  IF NEW.score < 0 OR NEW.score > v_max THEN
    RAISE EXCEPTION 'Score % is outside the allowed range 0-% for this assessment', NEW.score, v_max
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ces_score_range ON ces_student_assessments;
CREATE TRIGGER trg_ces_score_range
  BEFORE INSERT OR UPDATE OF score, quiz_id ON ces_student_assessments
  FOR EACH ROW EXECUTE FUNCTION ces_enforce_score_range();

-- 3. P04-16: pin the search_path of the staff-check function used by the RLS policies.
ALTER FUNCTION is_ces_staff() SET search_path = public, pg_temp;

COMMIT;
