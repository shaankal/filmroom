-- Film Room V7 §03 — weekly_results

CREATE TABLE weekly_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues (id),
  week_number INTEGER NOT NULL,
  season_year INTEGER NOT NULL,
  user_id UUID NOT NULL REFERENCES users (id),
  weekly_challenge_pts INTEGER NOT NULL DEFAULT 0,
  sunday_pts INTEGER NOT NULL DEFAULT 0,
  h2h_bonus_pts INTEGER NOT NULL DEFAULT 0,
  total_pts INTEGER GENERATED ALWAYS AS (
    ROUND(weekly_challenge_pts * 0.6 + sunday_pts * 0.3 + h2h_bonus_pts * 0.1)::int
  ) STORED,
  rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (league_id, week_number, season_year, user_id)
);
