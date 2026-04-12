-- Film Room V7 §03 — users

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  favorite_team TEXT,
  global_score INTEGER NOT NULL DEFAULT 0,
  rank_tier TEXT NOT NULL DEFAULT 'Prospect',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
