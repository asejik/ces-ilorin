-- Rollback for 20261023_p03_matric_counter.sql
-- Removes the counter table and function. Student rows are untouched.
-- NOTE: the app code must be reverted to the old count+1 logic too, or registration fails.
BEGIN;
DROP FUNCTION IF EXISTS ces_next_matric_seq(INT, INT);
DROP TABLE IF EXISTS ces_matric_counters;
COMMIT;
