-- Rollback for 20261024_p04_class_codes_and_rate_limits.sql
-- Removes class codes and rate limit counters. Student, score and attendance rows are untouched.
-- NOTE: revert the app code too, or attendance check-in and registration will fail.
BEGIN;
DROP FUNCTION IF EXISTS ces_rate_limit_hit(TEXT, INT, INT);
DROP TABLE IF EXISTS ces_rate_limits;
DROP TABLE IF EXISTS ces_class_codes;
COMMIT;
