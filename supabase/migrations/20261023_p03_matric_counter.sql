-- ==============================================================================
-- MIGRATION: 20261023_p03_matric_counter.sql
-- Fixes audit finding P03-01 (matric number race / reuse).
--
-- CLASSIFICATION : ADDITIVE. Creates one table and one function. No existing rows change.
--                  Reversible with 20261023_p03_matric_counter_rollback.sql
-- SCOPE          : CES objects only (shared Supabase project: sermons app untouched).
-- RULE           : sequence restarts every month (per YY + month), shared by both cohorts,
--                  never reused after a student is deleted. e.g. 26H801, 26H802 ...
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS ces_matric_counters (
  counter_key TEXT PRIMARY KEY,          -- e.g. '26H8' = year 26, August
  last_seq    INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE ces_matric_counters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE ces_matric_counters FROM anon, authenticated;
GRANT ALL ON TABLE ces_matric_counters TO service_role;

-- Seed from existing students so numbering continues where it stopped
-- (soft-deleted rows included, so their numbers are never handed out again).
INSERT INTO ces_matric_counters (counter_key, last_seq)
SELECT
  substr(matric_no, 9, 3) || (ascii(substr(matric_no, 11, 1)) - 64)::text AS counter_key,
  max(substr(matric_no, 12 + length((ascii(substr(matric_no, 11, 1)) - 64)::text))::int) AS last_seq
FROM ces_students
WHERE matric_no ~ '^CES/ILR/[0-9]{2}[A-L][0-9]+$'
  AND substr(matric_no, 12 + length((ascii(substr(matric_no, 11, 1)) - 64)::text)) ~ '^[0-9]+$'
GROUP BY 1
ON CONFLICT (counter_key) DO UPDATE SET last_seq = GREATEST(ces_matric_counters.last_seq, EXCLUDED.last_seq);

-- Atomic: one statement increments and returns, so two simultaneous registrations
-- can never receive the same number.
CREATE OR REPLACE FUNCTION ces_next_matric_seq(p_year INT, p_month INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key TEXT;
  v_seq INT;
BEGIN
  IF p_month < 1 OR p_month > 12 THEN
    RAISE EXCEPTION 'month must be 1-12';
  END IF;
  v_key := lpad((p_year % 100)::text, 2, '0') || chr(64 + p_month) || p_month::text;
  INSERT INTO ces_matric_counters (counter_key, last_seq)
  VALUES (v_key, 1)
  ON CONFLICT (counter_key) DO UPDATE SET last_seq = ces_matric_counters.last_seq + 1
  RETURNING last_seq INTO v_seq;
  RETURN v_seq;
END;
$$;

REVOKE ALL ON FUNCTION ces_next_matric_seq(INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION ces_next_matric_seq(INT, INT) TO service_role;

COMMIT;
