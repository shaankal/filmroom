-- Film Room V7 §03 — scenario_sets

CREATE TABLE scenario_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  set_type TEXT NOT NULL CHECK (set_type IN ('weekly', 'h2h', 'sunday_early', 'sunday_prime', 'offseason')),
  scenario_ids UUID[] NOT NULL,
  nfl_week INTEGER,
  season_year INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
