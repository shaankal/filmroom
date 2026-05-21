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

export type LeagueHealthState = "healthy" | "slipping" | "at_risk" | "dormant";

export type LeagueHubLeague = {
  id: string;
  name: string;
  type: LeagueType;
  inviteCode: string;
  currentWeek: number;
  seasonYear: number;
  commissionerId: string;
  memberCap: number;
  healthState: LeagueHealthState;
  leaguePassActive: boolean;
};

export type LeagueHubRivalryRow = {
  userAId: string;
  userAUsername: string;
  userBId: string;
  userBUsername: string;
  userAWins: number;
  userBWins: number;
  lastPlayed: string | null;
};

export type LeagueHubResponse = {
  league: LeagueHubLeague;
  members: LeagueHubMember[];
  standings: LeagueStandingRow[];
  pendingH2hCount: number;
  currentWeeklyChallengeId: string | null;
  rivalries: LeagueHubRivalryRow[];
};

export type UpdateLeagueSettingsBody = {
  name?: string;
  memberCap?: number;
};

export type LeagueHealthMemberActivity = {
  userId: string;
  username: string;
  playedThisWeek: boolean;
  lastActiveAt: string | null;
};

export type LeagueHealthResponse = {
  leagueId: string;
  healthState: LeagueHealthState;
  memberCount: number;
  activeThisWeek: number;
  members: LeagueHealthMemberActivity[];
};

export type LeagueNudgeResponse = {
  sent: number;
  inactiveUserIds: string[];
};
