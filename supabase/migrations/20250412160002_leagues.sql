-- Film Room V7 §03 — leagues

CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('private_fantasy', 'creator')),
  privacy TEXT NOT NULL DEFAULT 'private' CHECK (privacy IN ('private', 'public')),
  commissioner_id UUID NOT NULL REFERENCES users (id),
  member_cap INTEGER NOT NULL DEFAULT 20,
  scoring_mode TEXT NOT NULL DEFAULT 'standard',
  tiebreaker_rule TEXT NOT NULL DEFAULT 'h2h_then_speed',
  health_state TEXT NOT NULL DEFAULT 'healthy',
  invite_code TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  current_week INTEGER NOT NULL DEFAULT 1,
  season_year INTEGER NOT NULL DEFAULT date_part('year', now())::int,
  league_pass_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
