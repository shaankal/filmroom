-- Film Room V7 §03 — key indexes

CREATE INDEX idx_league_members_league_active ON league_members (league_id, is_active);

CREATE INDEX idx_weekly_results_league_week ON weekly_results (league_id, week_number, season_year);

CREATE INDEX idx_challenge_responses_user_source ON challenge_responses (user_id, source_type, source_id);

CREATE INDEX idx_h2h_challenges_challenged_status ON h2h_challenges (challenged_id, status);

CREATE INDEX idx_h2h_challenges_challenger_status ON h2h_challenges (challenger_id, status);

CREATE INDEX idx_sunday_windows_status_opens ON sunday_windows (status, opens_at);

CREATE INDEX idx_scenarios_status_difficulty ON scenarios (status, difficulty);

CREATE INDEX idx_leagues_invite_code ON leagues (invite_code);
