-- Film Room V7 §03 — h2h_challenges

CREATE TABLE h2h_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues (id),
  challenger_id UUID NOT NULL REFERENCES users (id),
  challenged_id UUID NOT NULL REFERENCES users (id),
  scenario_set_id UUID NOT NULL REFERENCES scenario_sets (id),
  week_number INTEGER NOT NULL,
  season_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'complete', 'expired')),
  challenger_score INTEGER,
  challenged_score INTEGER,
  winner_id UUID REFERENCES users (id),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
