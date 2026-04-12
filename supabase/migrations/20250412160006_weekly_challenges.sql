-- Film Room V7 §03 — weekly_challenges

CREATE TABLE weekly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues (id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  season_year INTEGER NOT NULL,
  scenario_set_id UUID NOT NULL REFERENCES scenario_sets (id),
  opens_at TIMESTAMPTZ NOT NULL,
  locks_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'locked', 'scored')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (league_id, week_number, season_year)
);
