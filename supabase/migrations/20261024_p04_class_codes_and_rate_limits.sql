-- ==============================================================================
-- MIGRATION: 20261024_p04_class_codes_and_rate_limits.sql
-- Fixes audit findings P04-03 (attendance forgeable) and P04-05 (no rate limiting).
--
-- CLASSIFICATION : ADDITIVE. Creates two tables and one function. No existing rows change.
--                  Reversible with 20261024_p04_class_codes_and_rate_limits_rollback.sql
-- SCOPE          : CES objects only (project is SHARED with the sermons app: untouched).
-- ==============================================================================

BEGIN;

-- Per-class attendance codes. The teacher opens a class and reads the code out;
-- students need it to check in. Rows are created closed by the server.
CREATE TABLE IF NOT EXISTS ces_class_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id UUID NOT NULL REFERENCES ces_semesters(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  code        TEXT NOT NULL,
  is_open     BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (semester_id, course_name)
);

-- Fixed-window rate limit counters (key = e.g. 'att:ip:1.2.3.4').
CREATE TABLE IF NOT EXISTS ces_rate_limits (
  key          TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hits         INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE ces_class_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ces_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE ces_class_codes, ces_rate_limits FROM anon, authenticated;
GRANT ALL ON TABLE ces_class_codes, ces_rate_limits TO service_role;

-- Atomic: records one attempt and returns TRUE while the caller is within the limit.
CREATE OR REPLACE FUNCTION ces_rate_limit_hit(p_key TEXT, p_max INT, p_window_seconds INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hits INT;
BEGIN
  INSERT INTO ces_rate_limits AS rl (key, window_start, hits)
  VALUES (p_key, NOW(), 1)
  ON CONFLICT (key) DO UPDATE SET
    hits = CASE
      WHEN rl.window_start < NOW() - make_interval(secs => p_window_seconds) THEN 1
      ELSE rl.hits + 1
    END,
    window_start = CASE
      WHEN rl.window_start < NOW() - make_interval(secs => p_window_seconds) THEN NOW()
      ELSE rl.window_start
    END
  RETURNING rl.hits INTO v_hits;

  -- Housekeeping: occasionally drop counters idle for over a day.
  IF random() < 0.01 THEN
    DELETE FROM ces_rate_limits WHERE window_start < NOW() - INTERVAL '1 day';
  END IF;

  RETURN v_hits <= p_max;
END;
$$;

REVOKE ALL ON FUNCTION ces_rate_limit_hit(TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION ces_rate_limit_hit(TEXT, INT, INT) TO service_role;

COMMIT;
