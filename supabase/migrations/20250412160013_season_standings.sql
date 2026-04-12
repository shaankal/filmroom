-- Film Room V7 §03 — season_standings

CREATE TABLE season_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  season_year INTEGER NOT NULL,
  total_pts INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  weeks_won INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (league_id, user_id, season_year)
);
