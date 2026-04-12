-- Film Room V7 §03 — sunday_windows

CREATE TABLE sunday_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  window_type TEXT NOT NULL CHECK (window_type IN ('early_slate', 'primetime')),
  scenario_set_id UUID NOT NULL REFERENCES scenario_sets (id),
  nfl_week INTEGER NOT NULL,
  season_year INTEGER NOT NULL,
  opens_at TIMESTAMPTZ NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'open', 'closed', 'scored')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
