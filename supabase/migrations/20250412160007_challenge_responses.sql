-- Film Room V7 §03 — challenge_responses

CREATE TABLE challenge_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id),
  scenario_id UUID NOT NULL REFERENCES scenarios (id),
  source_type TEXT NOT NULL CHECK (source_type IN ('weekly', 'h2h', 'sunday')),
  source_id UUID NOT NULL,
  answer TEXT NOT NULL CHECK (answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN NOT NULL,
  response_time_ms INTEGER NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, scenario_id, source_type, source_id)
);
