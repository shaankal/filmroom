/** API + mobile shared league payloads (V7). */

export type LeagueType = "private_fantasy" | "creator";

export type LeagueSummary = {
  id: string;
  name: string;
  type: LeagueType;
  inviteCode: string;
  currentWeek: number;
  seasonYear: number;
  commissionerId: string;
  memberCount: number;
  role: "commissioner" | "member";
};

export type LeaguesListResponse = {
  leagues: LeagueSummary[];
};

export type CreateLeagueBody = {
  name: string;
  type?: LeagueType;
};

export type CreateLeagueResponse = {
  league: LeagueSummary;
};

export type InvitePreviewResponse = {
  leagueId: string;
  name: string;
  type: LeagueType;
  commissionerUsername: string;
  memberCount: number;
  memberCap: number;
  inviteCode: string;
};

export type JoinLeagueBody = {
  invite_code: string;
};

export type JoinLeagueResponse = {
  leagueId: string;
};

export type LeagueHubMember = {
  userId: string;
  username: string;
  joinedAt: string;
  isCommissioner: boolean;
};

export type LeagueStandingRow = {
  userId: string;
  username: string;
  totalPts: number;
  rank: number | null;
  weeksWon: number;
};

export type LeagueHubLeague = {
  id: string;
  name: string;
  type: LeagueType;
  inviteCode: string;
  currentWeek: number;
  seasonYear: number;
  commissionerId: string;
  memberCap: number;
};

export type LeagueHubResponse = {
  league: LeagueHubLeague;
  members: LeagueHubMember[];
  standings: LeagueStandingRow[];
};
