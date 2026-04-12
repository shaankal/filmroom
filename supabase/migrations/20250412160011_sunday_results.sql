-- Film Room V7 §03 — sunday_results

CREATE TABLE sunday_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  window_id UUID NOT NULL REFERENCES sunday_windows (id) ON DELETE CASCADE,
  league_id UUID NOT NULL REFERENCES leagues (id) ON DELETE CASCADE,
  total_pts INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, window_id, league_id)
);
