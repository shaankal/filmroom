import type {
  ScenarioAnswer,
  WeeklyChallengeResponseRow,
  WeeklyChallengeScenario,
} from "./challenge";

export type SundayWindowType = "early_slate" | "primetime";
export type SundayWindowStatus = "scheduled" | "open" | "closed" | "scored";

export type SundayWindowSummary = {
  id: string;
  windowType: SundayWindowType;
  nflWeek: number;
  seasonYear: number;
  opensAt: string;
  closesAt: string;
  status: SundayWindowStatus;
};

export type SundayWindowsResponse = {
  active: SundayWindowSummary | null;
  upcoming: SundayWindowSummary[];
};

export type SundayWindowScenariosResponse = {
  window: SundayWindowSummary;
  scenarios: WeeklyChallengeScenario[];
  submission: {
    totalPoints: number;
    submittedAt: string;
    responses: WeeklyChallengeResponseRow[];
  } | null;
};

export type SundaySubmitBody = {
  leagueId: string;
  responses: Array<{
    scenarioId: string;
    answer: ScenarioAnswer;
    responseTimeMs: number;
  }>;
};

export type SundaySubmitResponse = {
  windowId: string;
  leagueId: string;
  totalPoints: number;
  responses: WeeklyChallengeResponseRow[];
};

export type SundayLiveStandingRow = {
  userId: string;
  username: string;
  totalPts: number;
  rank: number | null;
  weeklyChallengePts: number;
  sundayPts: number;
  h2hBonusPts: number;
};

export type SundayLiveResponse = {
  leagueId: string;
  weekNumber: number;
  seasonYear: number;
  activeWindow: SundayWindowSummary | null;
  standings: SundayLiveStandingRow[];
};
