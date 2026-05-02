/** API + mobile shared challenge payloads (Day 8+). */

export type ScenarioDifficulty =
  | "casual_sharp"
  | "ball_knower"
  | "sunday_sicko";

export type ScenarioAnswer = "A" | "B" | "C" | "D";

export type ScenarioChoice = {
  key: ScenarioAnswer;
  text: string;
};

export type WeeklyChallengeScenario = {
  id: string;
  conceptTag: string;
  difficulty: ScenarioDifficulty;
  context: string;
  prompt: string;
  choices: ScenarioChoice[];
  correctAnswer: ScenarioAnswer;
  explanation: string;
};

export type WeeklyChallengeResponseRow = {
  scenarioId: string;
  answer: ScenarioAnswer;
  isCorrect: boolean;
  pointsEarned: number;
  responseTimeMs: number;
};

export type WeeklyChallengeSummary = {
  id: string;
  leagueId: string;
  weekNumber: number;
  seasonYear: number;
  opensAt: string;
  locksAt: string;
  status: "open" | "locked" | "scored";
};

export type WeeklyChallengeDetailResponse = {
  challenge: WeeklyChallengeSummary;
  scenarios: WeeklyChallengeScenario[];
  submission: {
    totalPoints: number;
    submittedAt: string;
    responses: WeeklyChallengeResponseRow[];
  } | null;
};

export type WeeklyChallengeSubmitBody = {
  responses: Array<{
    scenarioId: string;
    answer: ScenarioAnswer;
    responseTimeMs: number;
  }>;
};

export type WeeklyChallengeSubmitResponse = {
  challengeId: string;
  totalPoints: number;
  responses: WeeklyChallengeResponseRow[];
  currentRank: number | null;
  previousRank: number | null;
  rankChange: number;
};

export type WeeklyChallengeResultsStandingRow = {
  userId: string;
  username: string;
  weeklyChallengePts: number;
  sundayPts: number;
  h2hBonusPts: number;
  totalPts: number;
  rank: number | null;
};

export type WeeklyChallengeResultsResponse = {
  challenge: WeeklyChallengeSummary;
  yourResult: {
    userId: string;
    username: string;
    weeklyChallengePts: number;
    sundayPts: number;
    h2hBonusPts: number;
    totalPts: number;
    rank: number | null;
    previousRank: number | null;
    rankChange: number;
  };
  standings: WeeklyChallengeResultsStandingRow[];
};
