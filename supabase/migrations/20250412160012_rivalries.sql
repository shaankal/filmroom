-- Film Room V7 §03 — rivalries

CREATE TABLE rivalries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues (id) ON DELETE CASCADE,
  user_a_id UUID NOT NULL REFERENCES users (id),
  user_b_id UUID NOT NULL REFERENCES users (id),
  user_a_wins INTEGER NOT NULL DEFAULT 0,
  user_b_wins INTEGER NOT NULL DEFAULT 0,
  last_played TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (league_id, user_a_id, user_b_id),
  CHECK (user_a_id < user_b_id)
);
