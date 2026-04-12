-- Film Room V7 §03 — league_pass_purchases

CREATE TABLE league_pass_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues (id),
  purchased_by UUID NOT NULL REFERENCES users (id),
  amount_cents INTEGER NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  revenuecat_txn_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'refunded', 'expired')),
  season_year INTEGER NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
