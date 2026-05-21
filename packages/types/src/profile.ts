export type ProfileRivalryRow = {
  opponentId: string;
  opponentUsername: string;
  yourWins: number;
  theirWins: number;
  lastPlayed: string | null;
};

export type ProfileLeagueStanding = {
  leagueId: string;
  leagueName: string;
  seasonYear: number;
  totalPts: number;
  rank: number | null;
  weeksWon: number;
};

export type ProfileResponse = {
  userId: string;
  username: string;
  email: string;
  globalScore: number;
  rankTier: string;
  favoriteTeam: string | null;
  leagueStandings: ProfileLeagueStanding[];
  rivalries: ProfileRivalryRow[];
};
