-- Rollback for 20261025_p04_audit_log_and_score_guard.sql
-- WARNING: dropping ces_audit_log permanently deletes the audit history recorded so far.
-- Export it first if you need it:  SELECT * FROM ces_audit_log;
BEGIN;
DROP TRIGGER IF EXISTS trg_ces_score_range ON ces_student_assessments;
DROP FUNCTION IF EXISTS ces_enforce_score_range();

DROP TRIGGER IF EXISTS trg_ces_audit_log_no_change ON ces_audit_log;
DROP TRIGGER IF EXISTS trg_ces_audit_log_no_truncate ON ces_audit_log;
DROP TABLE IF EXISTS ces_audit_log;
DROP FUNCTION IF EXISTS ces_audit_log_immutable();

ALTER FUNCTION is_ces_staff() RESET search_path;
COMMIT;
-- NOTE: revert the app code too (or keep the audit calls), or score/attendance overrides will fail.
