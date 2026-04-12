-- Film Room V7 §03 — content_reviews (abbreviated table in spec; full DDL)

CREATE TABLE content_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios (id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users (id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
