import type {
  WeeklyChallengeResponseRow,
  WeeklyChallengeScenario,
} from "./challenge";

export type H2HChallengeStatus = "pending" | "active" | "complete" | "expired";

export type CreateH2HChallengeBody = {
  leagueId: string;
  challengedUserId: string;
};

export type CreateH2HChallengeResponse = {
  challenge: H2HChallengeSummary;
};

export type H2HChallengeSummary = {
  id: string;
  leagueId: string;
  weekNumber: number;
  seasonYear: number;
  status: H2HChallengeStatus;
  challengerId: string;
  challengerUsername: string;
  challengedId: string;
  challengedUsername: string;
  challengerScore: number | null;
  challengedScore: number | null;
  winnerId: string | null;
  expiresAt: string;
  createdAt: string;
};

export type H2HPendingListResponse = {
  challenges: H2HChallengeSummary[];
};

export type H2HChallengeDetailResponse = {
  challenge: H2HChallengeSummary;
  scenarios: WeeklyChallengeScenario[];
  submission: {
    totalPoints: number;
    submittedAt: string;
    responses: WeeklyChallengeResponseRow[];
  } | null;
};

export type SubmitH2HChallengeBody = {
  responses: Array<{
    scenarioId: string;
    answer: "A" | "B" | "C" | "D";
    responseTimeMs: number;
  }>;
};

export type SubmitH2HChallengeResponse = {
  challengeId: string;
  totalPoints: number;
  responses: WeeklyChallengeResponseRow[];
  status: H2HChallengeStatus;
  winnerId: string | null;
  challengerScore: number | null;
  challengedScore: number | null;
};
